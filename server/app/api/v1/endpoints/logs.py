from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request, status
from sqlalchemy.orm import Session

from ....core.config import settings
from ....core.deps import get_current_user
from ....core.rate_limit import limiter
from ....db.session import get_db
from ....models.analytics import ErrorStatistic, IPTracking, LogAnalytics, SuspiciousEvent, TrafficSummary
from ....models.log_upload import LogUpload
from ....models.audit import AuditLog
from ....services.mapreduce import run_mapreduce

router = APIRouter()


def _validate_filename(filename: str) -> str:
    clean_name = filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1].strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Missing filename")
    if clean_name.startswith(".") or ".." in clean_name:
        raise HTTPException(status_code=400, detail="Unsafe filename")
    if not any(clean_name.lower().endswith(ext) for ext in settings.allowed_log_extensions):
        raise HTTPException(status_code=400, detail=f"Allowed log extensions: {', '.join(settings.allowed_log_extensions)}")
    return clean_name[:255]


def _decode_log_bytes(payload: bytes) -> str:
    if b"\x00" in payload[:2048]:
        raise HTTPException(status_code=400, detail="Binary files are not accepted")
    return payload.decode("utf-8", errors="ignore").replace("\x00", "")


def _persist_analytics(db: Session, upload_id: int, summary: dict):
    db.add(LogAnalytics(
        upload_id=upload_id,
        total_requests=summary.get("total_requests", 0),
        error_rate=summary.get("error_rate", 0),
        average_requests_per_minute=summary.get("average_requests_per_minute", 0),
        peak_traffic_hour=str(summary.get("peak_traffic_hour", {}).get("hour", "unknown")),
        status_categories=summary.get("status_categories", {}),
        status_codes=summary.get("status_codes", {}),
        top_endpoints=summary.get("top_endpoints", []),
        top_failing_endpoints=summary.get("top_failing_endpoints", []),
        detected_formats=summary.get("detected_formats", {}),
        alerts=summary.get("alerts", []),
    ))

    for hour, count in summary.get("hourly_traffic", {}).items():
        db.add(TrafficSummary(upload_id=upload_id, hour=str(hour), request_count=int(count)))

    for item in summary.get("requests_per_ip", []):
        db.add(IPTracking(upload_id=upload_id, ip_address=item["key"], request_count=item["count"]))

    for code, count in summary.get("status_codes", {}).items():
        if str(code).startswith(("4", "5")):
            db.add(ErrorStatistic(upload_id=upload_id, status_code=str(code), request_count=int(count)))

    for event in summary.get("suspicious_ips", []):
        db.add(SuspiciousEvent(
            upload_id=upload_id,
            ip_address=event.get("ip", "unknown"),
            severity=event.get("severity", "low"),
            reasons=event.get("reasons", []),
            total_requests=event.get("total_requests", 0),
            failed_requests=event.get("failed_requests", 0),
        ))


@router.post('/upload')
@limiter.limit("20/minute")
async def upload_log(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    filename = _validate_filename(file.filename or "")
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    payload = await file.read(max_bytes + 1)

    if len(payload) > max_bytes:
        db.add(AuditLog(actor_email=user.email, action=f"Rejected oversized upload {filename}"))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_size_mb} MB limit"
        )

    content = _decode_log_bytes(payload)
    if not content.strip():
        raise HTTPException(status_code=400, detail="Uploaded log file is empty")

    summary = run_mapreduce(content)

    rec = LogUpload(
        filename=filename,
        uploaded_by=user.id,
        summary=summary
    )

    db.add(rec)
    db.flush()
    _persist_analytics(db, rec.id, summary)

    db.add(
        AuditLog(
            actor_email=user.email,
            action=f"Uploaded and analyzed {filename}"
        )
    )

    db.commit()

    return {
        'upload_id': rec.id,
        'summary': summary
    }

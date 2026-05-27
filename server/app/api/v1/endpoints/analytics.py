from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ....core.deps import get_current_user
from ....db.session import get_db
from ....models.analytics import SuspiciousEvent
from ....models.log_upload import LogUpload
from ....models.audit import AuditLog

router = APIRouter()

@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    uploads = db.query(LogUpload).order_by(LogUpload.created_at.desc()).limit(20).all()
    audit = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
    total_uploads = db.query(func.count(LogUpload.id)).scalar() or 0
    suspicious_count = db.query(func.count(SuspiciousEvent.id)).scalar() or 0
    latest = uploads[0].summary if uploads else {}
    total_requests_processed = sum((upload.summary or {}).get("total_requests", 0) for upload in uploads)
    return {
        'uploads': [{
            'id': u.id, 'filename': u.filename, 'created_at': u.created_at.isoformat(), 'summary': u.summary
        } for u in uploads],
        'audit': [{
            'id': a.id, 'action': a.action, 'actor_email': a.actor_email, 'created_at': a.created_at.isoformat()
        } for a in audit],
        'upload_stats': {
            'total_uploads': total_uploads,
            'recent_uploads': len(uploads),
            'total_requests_recent': total_requests_processed,
            'suspicious_events': suspicious_count,
            'latest_error_rate': latest.get("error_rate", 0),
            'latest_peak_hour': latest.get("peak_traffic_hour", {"hour": "unknown", "count": 0}),
        }
    }

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session

from ....core.deps import get_current_user
from ....core.rate_limit import limiter
from ....db.session import get_db
from ....models.log_upload import LogUpload
from ....models.audit import AuditLog
from ....services.mapreduce import run_mapreduce

router = APIRouter()


@router.post('/upload')
@limiter.limit("20/minute")
async def upload_log(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if not file.filename.endswith('.log'):
        raise HTTPException(
            status_code=400,
            detail='Only .log files allowed'
        )

    content = (await file.read()).decode(
        'utf-8',
        errors='ignore'
    )

    summary = run_mapreduce(content)

    rec = LogUpload(
        filename=file.filename,
        uploaded_by=user.id,
        summary=summary
    )

    db.add(rec)

    db.add(
        AuditLog(
            actor_email=user.email,
            action=f"Uploaded {file.filename}"
        )
    )

    db.commit()

    return {
        'upload_id': rec.id,
        'summary': summary
    }

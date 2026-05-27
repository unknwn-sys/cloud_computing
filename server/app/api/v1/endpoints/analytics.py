from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ....core.deps import get_current_user
from ....db.session import get_db
from ....models.log_upload import LogUpload
from ....models.audit import AuditLog

router = APIRouter()

@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    uploads = db.query(LogUpload).order_by(LogUpload.created_at.desc()).limit(20).all()
    audit = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
    return {
        'uploads': [{
            'id': u.id, 'filename': u.filename, 'created_at': u.created_at.isoformat(), 'summary': u.summary
        } for u in uploads],
        'audit': [{
            'id': a.id, 'action': a.action, 'actor_email': a.actor_email, 'created_at': a.created_at.isoformat()
        } for a in audit]
    }

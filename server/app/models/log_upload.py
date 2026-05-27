from datetime import datetime
from sqlalchemy import ForeignKey, JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from ..db.session import Base

class LogUpload(Base):
    __tablename__ = "log_uploads"
    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    summary: Mapped[dict] = mapped_column(JSON)

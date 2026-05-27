from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from ..db.session import Base


class LogAnalytics(Base):
    __tablename__ = "log_analytics"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("log_uploads.id"), index=True)
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    error_rate: Mapped[float] = mapped_column(Float, default=0)
    average_requests_per_minute: Mapped[float] = mapped_column(Float, default=0)
    peak_traffic_hour: Mapped[str] = mapped_column(String(16), default="unknown")
    status_categories: Mapped[dict] = mapped_column(JSON, default=dict)
    status_codes: Mapped[dict] = mapped_column(JSON, default=dict)
    top_endpoints: Mapped[list] = mapped_column(JSON, default=list)
    top_failing_endpoints: Mapped[list] = mapped_column(JSON, default=list)
    detected_formats: Mapped[dict] = mapped_column(JSON, default=dict)
    alerts: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SuspiciousEvent(Base):
    __tablename__ = "suspicious_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("log_uploads.id"), index=True)
    ip_address: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(32), default="low")
    reasons: Mapped[list] = mapped_column(JSON, default=list)
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    failed_requests: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TrafficSummary(Base):
    __tablename__ = "traffic_summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("log_uploads.id"), index=True)
    hour: Mapped[str] = mapped_column(String(16), index=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IPTracking(Base):
    __tablename__ = "ip_tracking"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("log_uploads.id"), index=True)
    ip_address: Mapped[str] = mapped_column(String(64), index=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ErrorStatistic(Base):
    __tablename__ = "error_statistics"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_id: Mapped[int] = mapped_column(ForeignKey("log_uploads.id"), index=True)
    status_code: Mapped[str] = mapped_column(String(8), index=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

"""enterprise analytics tables

Revision ID: 20260527_0001
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa


revision = "20260527_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "log_analytics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("upload_id", sa.Integer(), nullable=False),
        sa.Column("total_requests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_rate", sa.Float(), nullable=False, server_default="0"),
        sa.Column("average_requests_per_minute", sa.Float(), nullable=False, server_default="0"),
        sa.Column("peak_traffic_hour", sa.String(length=16), nullable=False, server_default="unknown"),
        sa.Column("status_categories", sa.JSON(), nullable=False),
        sa.Column("status_codes", sa.JSON(), nullable=False),
        sa.Column("top_endpoints", sa.JSON(), nullable=False),
        sa.Column("top_failing_endpoints", sa.JSON(), nullable=False),
        sa.Column("detected_formats", sa.JSON(), nullable=False),
        sa.Column("alerts", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["upload_id"], ["log_uploads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_log_analytics_upload_id", "log_analytics", ["upload_id"])

    op.create_table(
        "suspicious_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("upload_id", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=False),
        sa.Column("severity", sa.String(length=32), nullable=False, server_default="low"),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("total_requests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_requests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["upload_id"], ["log_uploads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_suspicious_events_upload_id", "suspicious_events", ["upload_id"])
    op.create_index("ix_suspicious_events_ip_address", "suspicious_events", ["ip_address"])

    op.create_table(
        "traffic_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("upload_id", sa.Integer(), nullable=False),
        sa.Column("hour", sa.String(length=16), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["upload_id"], ["log_uploads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_traffic_summaries_upload_id", "traffic_summaries", ["upload_id"])
    op.create_index("ix_traffic_summaries_hour", "traffic_summaries", ["hour"])

    op.create_table(
        "ip_tracking",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("upload_id", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["upload_id"], ["log_uploads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ip_tracking_upload_id", "ip_tracking", ["upload_id"])
    op.create_index("ix_ip_tracking_ip_address", "ip_tracking", ["ip_address"])

    op.create_table(
        "error_statistics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("upload_id", sa.Integer(), nullable=False),
        sa.Column("status_code", sa.String(length=8), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["upload_id"], ["log_uploads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_error_statistics_upload_id", "error_statistics", ["upload_id"])
    op.create_index("ix_error_statistics_status_code", "error_statistics", ["status_code"])


def downgrade():
    op.drop_index("ix_error_statistics_status_code", table_name="error_statistics")
    op.drop_index("ix_error_statistics_upload_id", table_name="error_statistics")
    op.drop_table("error_statistics")
    op.drop_index("ix_ip_tracking_ip_address", table_name="ip_tracking")
    op.drop_index("ix_ip_tracking_upload_id", table_name="ip_tracking")
    op.drop_table("ip_tracking")
    op.drop_index("ix_traffic_summaries_hour", table_name="traffic_summaries")
    op.drop_index("ix_traffic_summaries_upload_id", table_name="traffic_summaries")
    op.drop_table("traffic_summaries")
    op.drop_index("ix_suspicious_events_ip_address", table_name="suspicious_events")
    op.drop_index("ix_suspicious_events_upload_id", table_name="suspicious_events")
    op.drop_table("suspicious_events")
    op.drop_index("ix_log_analytics_upload_id", table_name="log_analytics")
    op.drop_table("log_analytics")

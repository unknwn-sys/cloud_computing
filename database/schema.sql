CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS log_uploads (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  summary JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_email VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS log_analytics (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES log_uploads(id),
  total_requests INTEGER DEFAULT 0,
  error_rate DOUBLE PRECISION DEFAULT 0,
  average_requests_per_minute DOUBLE PRECISION DEFAULT 0,
  peak_traffic_hour VARCHAR(16) DEFAULT 'unknown',
  status_categories JSONB NOT NULL,
  status_codes JSONB NOT NULL,
  top_endpoints JSONB NOT NULL,
  top_failing_endpoints JSONB NOT NULL,
  detected_formats JSONB NOT NULL,
  alerts JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suspicious_events (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES log_uploads(id),
  ip_address VARCHAR(64) NOT NULL,
  severity VARCHAR(32) DEFAULT 'low',
  reasons JSONB NOT NULL,
  total_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traffic_summaries (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES log_uploads(id),
  hour VARCHAR(16) NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ip_tracking (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES log_uploads(id),
  ip_address VARCHAR(64) NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_statistics (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER REFERENCES log_uploads(id),
  status_code VARCHAR(8) NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_log_uploads_created_at ON log_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_analytics_upload_id ON log_analytics(upload_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_upload_id ON suspicious_events(upload_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_ip ON suspicious_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_traffic_summaries_upload_hour ON traffic_summaries(upload_id, hour);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_upload_ip ON ip_tracking(upload_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_error_statistics_upload_code ON error_statistics(upload_id, status_code);

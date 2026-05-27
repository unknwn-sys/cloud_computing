# API Endpoints

Base path:

```text
/api/v1
```

## Authentication

### POST `/auth/login`

Request:

```json
{
  "email": "admin@cloudlog.com",
  "password": "Admin@123"
}
```

Response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

## Logs

### POST `/logs/upload`

Requires:

```text
Authorization: Bearer <token>
```

Accepts multipart form field `file`.

Supported extensions are controlled by:

```text
ALLOWED_LOG_EXTENSIONS=.log,.txt,.json
```

Upload size is controlled by:

```text
MAX_UPLOAD_SIZE_MB=10
```

Response includes advanced analytics:

- total requests
- HTTP status categories
- dynamic status codes
- top endpoints
- failing endpoints
- hourly and minute traffic
- requests per IP
- suspicious IPs
- brute-force candidates
- bot traffic
- high error-rate alerts
- detected log formats

## Analytics

### GET `/analytics/dashboard`

Requires:

```text
Authorization: Bearer <token>
```

Returns:

- recent uploads
- upload summaries
- audit log events
- upload statistics

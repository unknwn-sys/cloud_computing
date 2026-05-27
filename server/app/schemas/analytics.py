from pydantic import BaseModel

class LogSummary(BaseModel):
    total_requests: int
    http_404: int
    http_500: int
    hourly_traffic: dict[str, int]

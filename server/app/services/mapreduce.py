from __future__ import annotations

from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from datetime import datetime
import json
import math
import re
from typing import Any


APACHE_NGINX_PATTERN = re.compile(
    r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3})\s+\S+\s+\S+\s+'
    r'\[(?P<time>[^\]]+)\]\s+"(?P<method>[A-Z]+)\s+(?P<path>\S+)'
    r'(?:\s+HTTP/\d(?:\.\d)?)?"\s+(?P<status>\d{3})'
)
GENERIC_HTTP_PATTERN = re.compile(
    r'(?P<method>GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+'
    r'(?P<path>/[^\s"\?]+)[^\n]*?\s(?P<status>\d{3})(?:\s|$)',
    re.IGNORECASE,
)
BRACKET_TIME_PATTERN = re.compile(r"\[(?P<hour>\d{2}):\d{2}:\d{2}\]")
ISO_TIME_PATTERN = re.compile(r"(?P<hour>\d{2}):\d{2}:\d{2}")
IP_PATTERN = re.compile(r"\b(?P<ip>\d{1,3}(?:\.\d{1,3}){3})\b")
STATUS_PATTERN = re.compile(r"\b(?P<status>[1-5]\d{2})\b")
BOT_PATTERN = re.compile(r"bot|crawler|spider|scraper|curl|wget|python-requests|nikto|sqlmap", re.I)
LOGIN_PATTERN = re.compile(r"login|signin|auth|wp-login|admin", re.I)
SENSITIVE_PATH_PATTERN = re.compile(r"\.env|phpmyadmin|wp-admin|wp-login|/admin|/login|/config|/backup", re.I)

TRACKED_STATUS_CODES = ["200", "201", "301", "302", "400", "401", "403", "404", "405", "429", "500", "502", "503"]
STATUS_CATEGORIES = {
    "1xx": "informational",
    "2xx": "success",
    "3xx": "redirect",
    "4xx": "client_error",
    "5xx": "server_error",
}


@dataclass
class ParsedLogLine:
    status: str
    method: str
    endpoint: str
    ip: str
    hour: str
    minute_key: str
    user_agent: str
    format_name: str
    raw: str


def split_chunks(lines: list[str], chunk_size: int = 5000):
    for i in range(0, len(lines), chunk_size):
        yield lines[i:i + chunk_size]


def _safe_endpoint(value: Any) -> str:
    endpoint = str(value or "/").strip().split("?")[0]
    if not endpoint.startswith("/"):
        endpoint = f"/{endpoint}" if endpoint else "/"
    return endpoint[:160]


def _extract_hour(value: Any, raw: str) -> str:
    if value:
        text = str(value)
        for fmt in ("%d/%b/%Y:%H:%M:%S %z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(text.replace("Z", "+0000"), fmt).strftime("%H")
            except ValueError:
                pass
        match = ISO_TIME_PATTERN.search(text)
        if match:
            return match.group("hour")

    match = BRACKET_TIME_PATTERN.search(raw) or ISO_TIME_PATTERN.search(raw)
    return match.group("hour") if match else "unknown"


def _minute_key(hour: str, raw: str) -> str:
    if hour == "unknown":
        return "unknown"
    minute_match = re.search(rf"\b{hour}:(?P<minute>\d{{2}}):\d{{2}}\b", raw)
    minute = minute_match.group("minute") if minute_match else "00"
    return f"{hour}:{minute}"


def _parse_json_log(line: str) -> ParsedLogLine | None:
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        return None

    status = data.get("status") or data.get("status_code") or data.get("response_status") or data.get("code")
    endpoint = data.get("path") or data.get("url") or data.get("endpoint") or data.get("request_uri") or data.get("route")
    if status is None or endpoint is None:
        return None

    method = str(data.get("method") or data.get("http_method") or "GET").upper()
    ip = str(data.get("ip") or data.get("remote_addr") or data.get("client_ip") or data.get("source_ip") or "unknown")
    hour = _extract_hour(data.get("timestamp") or data.get("time") or data.get("@timestamp"), line)
    return ParsedLogLine(
        status=str(status),
        method=method,
        endpoint=_safe_endpoint(endpoint),
        ip=ip,
        hour=hour,
        minute_key=_minute_key(hour, line),
        user_agent=str(data.get("user_agent") or data.get("agent") or ""),
        format_name="json",
        raw=line,
    )


def _parse_text_log(line: str) -> ParsedLogLine | None:
    apache = APACHE_NGINX_PATTERN.search(line)
    if apache:
        hour = _extract_hour(apache.group("time"), line)
        user_agent = line.split('"')[-2] if line.count('"') >= 6 else ""
        return ParsedLogLine(
            status=apache.group("status"),
            method=apache.group("method").upper(),
            endpoint=_safe_endpoint(apache.group("path")),
            ip=apache.group("ip"),
            hour=hour,
            minute_key=_minute_key(hour, line),
            user_agent=user_agent,
            format_name="apache_nginx",
            raw=line,
        )

    generic = GENERIC_HTTP_PATTERN.search(line)
    status = generic.group("status") if generic else None
    method = generic.group("method").upper() if generic else "GET"
    endpoint = generic.group("path") if generic else None

    if not status:
        status_match = STATUS_PATTERN.search(line)
        status = status_match.group("status") if status_match else None
    if not endpoint:
        endpoint_match = re.search(r"\s(/[A-Za-z0-9_\-./%]+)", line)
        endpoint = endpoint_match.group(1) if endpoint_match else None
    if not status or not endpoint:
        return None

    ip_match = IP_PATTERN.search(line)
    hour = _extract_hour(None, line)
    return ParsedLogLine(
        status=status,
        method=method,
        endpoint=_safe_endpoint(endpoint),
        ip=ip_match.group("ip") if ip_match else "unknown",
        hour=hour,
        minute_key=_minute_key(hour, line),
        user_agent=line,
        format_name="generic_http",
        raw=line,
    )


def parse_line(line: str) -> ParsedLogLine | None:
    clean_line = line.replace("\x00", "").strip()
    if not clean_line:
        return None
    return _parse_json_log(clean_line) or _parse_text_log(clean_line)


def _new_bucket() -> dict[str, Any]:
    return {
        "total_requests": 0,
        "status_codes": Counter(),
        "status_categories": Counter(),
        "endpoints": Counter(),
        "failing_endpoints": Counter(),
        "hourly_traffic": Counter(),
        "minute_traffic": Counter(),
        "requests_per_ip": Counter(),
        "ip_failures": Counter(),
        "login_failures": Counter(),
        "bot_requests": Counter(),
        "sensitive_hits": Counter(),
        "methods": Counter(),
        "formats": Counter(),
        "unparsed_lines": 0,
    }


def _status_category(status: str) -> str:
    return f"{status[0]}xx" if status and status[0] in "12345" else "unknown"


def mapper(chunk: list[str]) -> dict[str, Any]:
    bucket = _new_bucket()

    for line in chunk:
        parsed = parse_line(line)
        if not parsed:
            bucket["unparsed_lines"] += 1
            continue

        category = _status_category(parsed.status)
        is_failure = category in {"4xx", "5xx"}
        is_login_path = bool(LOGIN_PATTERN.search(parsed.endpoint))
        is_bot = bool(BOT_PATTERN.search(parsed.user_agent) or BOT_PATTERN.search(parsed.endpoint))

        bucket["total_requests"] += 1
        bucket["status_codes"][parsed.status] += 1
        bucket["status_categories"][category] += 1
        bucket["endpoints"][parsed.endpoint] += 1
        bucket["hourly_traffic"][parsed.hour] += 1
        bucket["minute_traffic"][parsed.minute_key] += 1
        bucket["requests_per_ip"][parsed.ip] += 1
        bucket["methods"][parsed.method] += 1
        bucket["formats"][parsed.format_name] += 1

        if is_failure:
            bucket["failing_endpoints"][parsed.endpoint] += 1
            bucket["ip_failures"][parsed.ip] += 1
        if is_login_path and parsed.status in {"400", "401", "403", "429"}:
            bucket["login_failures"][parsed.ip] += 1
        if is_bot:
            bucket["bot_requests"][parsed.ip] += 1
        if SENSITIVE_PATH_PATTERN.search(parsed.endpoint):
            bucket["sensitive_hits"][parsed.ip] += 1

    return bucket


def _merge_counters(target: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    target["total_requests"] += source["total_requests"]
    target["unparsed_lines"] += source["unparsed_lines"]
    for key, value in source.items():
        if isinstance(value, Counter):
            target[key].update(value)
    return target


def shuffle_sort(mapped: list[dict[str, Any]]) -> dict[str, Any]:
    result = _new_bucket()
    for bucket in mapped:
        _merge_counters(result, bucket)
    return result


def _top(counter: Counter, limit: int = 10) -> list[dict[str, Any]]:
    return [{"key": key, "count": count} for key, count in counter.most_common(limit)]


def _counter_dict(counter: Counter) -> dict[str, int]:
    return dict(sorted(counter.items(), key=lambda item: item[0]))


def _build_suspicious_events(grouped: dict[str, Any]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    requests_per_ip: Counter = grouped["requests_per_ip"]
    ip_failures: Counter = grouped["ip_failures"]
    login_failures: Counter = grouped["login_failures"]
    bot_requests: Counter = grouped["bot_requests"]
    sensitive_hits: Counter = grouped["sensitive_hits"]

    for ip, total in requests_per_ip.items():
        failures = ip_failures.get(ip, 0)
        login_fail_count = login_failures.get(ip, 0)
        bot_count = bot_requests.get(ip, 0)
        sensitive_count = sensitive_hits.get(ip, 0)
        failure_rate = failures / total if total else 0
        reasons = []
        severity = "low"

        if total >= 500:
            reasons.append("high request volume")
            severity = "medium"
        if failures >= 25 or failure_rate >= 0.45:
            reasons.append("high error rate")
            severity = "high"
        if login_fail_count >= 5:
            reasons.append("possible brute-force login attempts")
            severity = "critical"
        if bot_count >= 10:
            reasons.append("bot or scripted traffic")
            severity = "medium" if severity == "low" else severity
        if sensitive_count >= 3:
            reasons.append("sensitive path probing")
            severity = "high" if severity != "critical" else severity

        if reasons:
            events.append({
                "ip": ip,
                "severity": severity,
                "reasons": reasons,
                "total_requests": total,
                "failed_requests": failures,
                "login_failures": login_fail_count,
                "bot_requests": bot_count,
                "sensitive_hits": sensitive_count,
            })

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return sorted(events, key=lambda item: (severity_order[item["severity"]], -item["total_requests"]))[:25]


def reducer(grouped: dict[str, Any]) -> dict[str, Any]:
    total_requests = grouped["total_requests"]
    hourly_traffic: Counter = grouped["hourly_traffic"]
    minute_traffic: Counter = grouped["minute_traffic"]
    status_codes: Counter = grouped["status_codes"]
    status_categories: Counter = grouped["status_categories"]
    failures = status_categories.get("4xx", 0) + status_categories.get("5xx", 0)
    minute_count = len([key for key in minute_traffic if key != "unknown"]) or 1
    peak_hour, peak_count = hourly_traffic.most_common(1)[0] if hourly_traffic else ("unknown", 0)
    suspicious_events = _build_suspicious_events(grouped)
    error_rate = round((failures / total_requests) * 100, 2) if total_requests else 0

    status_categories_payload = {
        key: {
            "label": STATUS_CATEGORIES[key],
            "count": status_categories.get(key, 0),
        }
        for key in STATUS_CATEGORIES
    }
    dynamic_status_codes = {code: status_codes.get(code, 0) for code in sorted(status_codes)}
    tracked_status_codes = {code: status_codes.get(code, 0) for code in TRACKED_STATUS_CODES}

    alerts = []
    if error_rate >= 25:
        alerts.append({"severity": "high", "message": f"High error rate detected: {error_rate}%"})
    if status_codes.get("429", 0) >= 10:
        alerts.append({"severity": "medium", "message": "Rate-limit responses indicate possible abusive traffic"})
    if any(event["severity"] == "critical" for event in suspicious_events):
        alerts.append({"severity": "critical", "message": "Critical suspicious IP behavior detected"})
    if grouped["unparsed_lines"] > max(10, math.ceil(total_requests * 0.2)):
        alerts.append({"severity": "medium", "message": "Many log lines could not be parsed; check source format"})

    return {
        "total_requests": total_requests,
        "http_404": status_codes.get("404", 0),
        "http_500": status_codes.get("500", 0),
        "status_categories": status_categories_payload,
        "status_codes": dynamic_status_codes,
        "tracked_status_codes": tracked_status_codes,
        "top_endpoints": _top(grouped["endpoints"], 10),
        "top_failing_endpoints": _top(grouped["failing_endpoints"], 10),
        "hourly_traffic": _counter_dict(hourly_traffic),
        "minute_traffic": _counter_dict(minute_traffic),
        "requests_per_ip": _top(grouped["requests_per_ip"], 12),
        "suspicious_ips": suspicious_events,
        "brute_force_candidates": _top(grouped["login_failures"], 10),
        "bot_traffic": _top(grouped["bot_requests"], 10),
        "sensitive_path_probing": _top(grouped["sensitive_hits"], 10),
        "average_requests_per_minute": round(total_requests / minute_count, 2) if total_requests else 0,
        "peak_traffic_hour": {"hour": peak_hour, "count": peak_count},
        "error_rate": error_rate,
        "methods": _counter_dict(grouped["methods"]),
        "detected_formats": _counter_dict(grouped["formats"]),
        "unparsed_lines": grouped["unparsed_lines"],
        "alerts": alerts,
    }


def run_mapreduce(content: str) -> dict[str, Any]:
    lines = content.splitlines()
    if not lines:
        return reducer(_new_bucket())

    chunks = list(split_chunks(lines))
    if len(chunks) == 1:
        return reducer(shuffle_sort([mapper(chunks[0])]))

    with ProcessPoolExecutor() as executor:
        mapped = list(executor.map(mapper, chunks))
    return reducer(shuffle_sort(mapped))

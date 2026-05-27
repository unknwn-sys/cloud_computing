from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
import re

LOG_PATTERN = re.compile(r"\[(\d{2}):\d{2}:\d{2}\].*\s(\d{3})\s")

def split_chunks(lines: list[str], chunk_size: int = 5000):
    for i in range(0, len(lines), chunk_size):
        yield lines[i:i+chunk_size]

def mapper(chunk: list[str]):
    kv = []
    for line in chunk:
        m = LOG_PATTERN.search(line)
        if not m:
            continue
        hour, code = m.group(1), m.group(2)
        kv.append(("total_requests", 1))
        kv.append((f"hour_{hour}", 1))
        if code == "404": kv.append(("http_404", 1))
        if code == "500": kv.append(("http_500", 1))
    return kv

def shuffle_sort(mapped):
    grouped = defaultdict(list)
    for pairs in mapped:
        for k, v in pairs:
            grouped[k].append(v)
    return grouped

def reducer(grouped):
    result = {k: sum(vs) for k, vs in grouped.items()}
    hourly = {k.split("_")[1]: v for k, v in result.items() if k.startswith("hour_")}
    return {
        "total_requests": result.get("total_requests", 0),
        "http_404": result.get("http_404", 0),
        "http_500": result.get("http_500", 0),
        "hourly_traffic": dict(sorted(hourly.items())),
    }

def run_mapreduce(content: str):
    lines = content.splitlines()
    chunks = list(split_chunks(lines))
    with ProcessPoolExecutor() as ex:
        mapped = list(ex.map(mapper, chunks))
    grouped = shuffle_sort(mapped)
    return reducer(grouped)

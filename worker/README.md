# Worker
This project executes MapReduce in `server/app/services/mapreduce.py` using `ProcessPoolExecutor` for true parallelism.
For horizontal scaling, isolate this module into a Railway worker service and consume queue messages.

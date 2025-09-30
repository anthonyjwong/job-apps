import asyncio
import logging
import os

import debugpy
import uvicorn
from app.routers import applications, bulk, data, jobs, users
from app.worker.tasks import get_task_status
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("debug.log")],
)

# ensure handlers use a formatter that includes timestamps
_fmt = "%(asctime)s - %(levelname)s - %(message)s"
_datefmt = "%Y-%m-%d %H:%M:%S"
_formatter = logging.Formatter(fmt=_fmt, datefmt=_datefmt)
for _h in logging.getLogger().handlers:
    _h.setFormatter(_formatter)

# enable in-process debugpy when requested (works with uvicorn --reload)
if os.environ.get("DEBUGPY", "0") == "1":
    try:
        _port = int(os.environ.get("DEBUGPY_PORT", "5678"))
        debugpy.listen(("0.0.0.0", _port))
        logging.info(f"debugpy listening on 0.0.0.0:{_port}")
        if os.environ.get("DEBUGPY_WAIT_FOR_CLIENT", "0") == "1":
            logging.info("Waiting for debugger to attach...")
            debugpy.wait_for_client()
    except Exception:
        logging.error("Failed to initialize debugpy", exc_info=True)

app = FastAPI(title="Job Application API")
app.include_router(jobs.router, tags=["Jobs"])
app.include_router(applications.router, tags=["Applications"])
app.include_router(users.router, tags=["Users"])
app.include_router(data.router, prefix="/data", tags=["Data"])
app.include_router(bulk.router, prefix="/bulk", tags=["Bulk"])

# allow requests from your frontend (e.g., http://localhost:3000)
origins = [
    "http://localhost:3000",
    "http://frontend:3000",
    # add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# limit concurrent background operations that might use DB connections
MAX_CONCURRENT_TASKS = int(os.environ.get("MAX_CONCURRENT_TASKS", "8"))
task_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/tasks/{task_id}")
def check_task(task_id: str):
    return get_task_status(task_id)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient


dotenv_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=dotenv_path)


MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/expense_tracker",
)
ML_SERVICE_URL = os.getenv(
    "ML_SERVICE_URL",
    "http://127.0.0.1:8000",
)

backend_db: Any = None


def get_db() -> Any:
    global backend_db

    if backend_db is None:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=2000,
        )

        client.admin.command("ping")

        backend_db = client.get_default_database()

    return backend_db
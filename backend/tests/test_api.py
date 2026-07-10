import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app


class FakeCollection:
    def __init__(self):
        self.docs = []

    def find_one(self, query):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def insert_one(self, doc):
        self.docs.append(doc)
        return type("Result", (), {"inserted_id": len(self.docs) - 1})()


class FakeDB:
    def __init__(self):
        self.users = FakeCollection()
        self.expenses = FakeCollection()


@pytest.fixture
def client(monkeypatch):
    fake_db = FakeDB()

    def fake_get_db():
        return fake_db

    monkeypatch.setattr("app.main.get_db", fake_get_db)
    return TestClient(app)


def test_register_and_login_flow(client):
    register_res = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "Pass123!"},
    )
    assert register_res.status_code == 201
    assert register_res.json()["message"] == "User registered successfully"

    login_res = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "Pass123!"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["email"] == "alice@example.com"
    assert "token" in login_res.json()


def test_insights_returns_fallback_when_ml_service_is_unavailable(client, monkeypatch):
    register_res = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice2@example.com", "password": "Pass123!"},
    )
    assert register_res.status_code == 201

    login_res = client.post(
        "/api/auth/login",
        json={"email": "alice2@example.com", "password": "Pass123!"},
    )
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    expense_res = client.post(
        "/api/expenses",
        headers=headers,
        json={"amount": 125, "description": "Lunch", "category": "Food", "date": "2026-07-09"},
    )
    assert expense_res.status_code == 201

    class FailingHttpClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, *args, **kwargs):
            raise httpx.ConnectError("ML service unavailable")

    monkeypatch.setattr("app.main.httpx.Client", FailingHttpClient)

    insights_res = client.get("/api/insights", headers=headers)
    assert insights_res.status_code == 200
    assert insights_res.json()["status"] == "Unavailable"
    assert insights_res.json()["forecast"] is None

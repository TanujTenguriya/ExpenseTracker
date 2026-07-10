from datetime import datetime
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends

from app.database import (
    ML_SERVICE_URL,
    get_db,
)
from app.utils.auth import get_current_user


def _parse_date(value: str | datetime) -> datetime | None:
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def _compute_fallback_insights(expenses: list[dict[str, Any]]) -> dict[str, Any]:
    total_spent = sum(float(exp["amount"]) for exp in expenses)
    average_expense = total_spent / len(expenses) if expenses else 0

    monthly_totals: dict[str, float] = {}
    for exp in expenses:
        dt = _parse_date(exp["date"])
        if not dt:
            continue
        key = f"{dt.year}-{dt.month:02d}"
        monthly_totals[key] = monthly_totals.get(key, 0.0) + float(exp["amount"])

    sorted_months = sorted(monthly_totals.items())
    predicted_next_month = 0.0
    trend = "insufficient_data"
    if sorted_months:
        values = [value for _, value in sorted_months]
        if len(values) == 1:
            predicted_next_month = values[-1]
            trend = "stable"
        else:
            predicted_next_month = sum(values) / len(values)
            if values[-1] > values[-2]:
                trend = "increasing"
            elif values[-1] < values[-2]:
                trend = "decreasing"
            else:
                trend = "stable"

    insights = [
        "⚠️ AI insights service is currently unavailable, showing fallback metrics instead."
    ]
    if average_expense and predicted_next_month > average_expense * 1.5:
        insights.append("💡 Your next-month spending appears elevated compared to your average expense.")

    return {
        "insights": insights,
        "total_spent": float(total_spent),
        "average_expense": float(average_expense),
        "score": 80,
        "status": "Fallback",
        "forecast": {
            "predicted_next_month": round(predicted_next_month, 2),
            "confidence_range": None,
            "trend": trend,
        },
    }


router = APIRouter(
    prefix="/api/insights",
    tags=["AI Insights"],
)


@router.get("")
def get_insights(
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
) -> dict[str, Any]:

    docs = list(
        db.expenses.find({
            "user": current_user["id"],
        }).sort("date", 1)
    )

    expenses = [
        {
            "amount": doc["amount"],
            "category": doc.get(
                "category",
                "Other",
            ),
            "date": (
                doc["date"].isoformat()
                if isinstance(
                    doc["date"],
                    datetime,
                )
                else doc["date"]
            ),
        }
        for doc in docs
    ]

    if not expenses:
        return {
            "insights": [],
            "score": 100,
            "status": "No Data",
            "forecast": None,
        }

    payload = {
        "user_id": current_user["id"],
        "expenses": expenses,
    }

    try:
        with httpx.Client(
            timeout=10.0
        ) as client:

            response = client.post(
                f"{ML_SERVICE_URL}/analyze",
                json=payload,
            )

            response.raise_for_status()

            return response.json()

    except Exception:
        return _compute_fallback_insights(expenses)
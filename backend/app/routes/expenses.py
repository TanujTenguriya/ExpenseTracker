from datetime import datetime, timezone
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.database import get_db
from app.schemas import (
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    MessageResponse,
)
from app.utils.auth import get_current_user


router = APIRouter(tags=["Expenses"])


def parse_date(value: str | None) -> datetime:

    if not value:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromisoformat(value)

    except ValueError:
        return datetime.strptime(
            value,
            "%Y-%m-%d",
        )


@router.post(
    "/api/expenses",
    response_model=ExpenseOut,
    status_code=status.HTTP_201_CREATED,
)
def add_expense(
    payload: ExpenseCreate,
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
) -> ExpenseOut:

    if payload.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid amount",
        )

    if (
        not payload.description
        or not payload.description.strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="Description required",
        )

    expense_id = uuid4().hex

    expense_doc = {
        "_id": expense_id,
        "user": current_user["id"],
        "amount": payload.amount,
        "description": payload.description,
        "category": (
            payload.category.strip()
            if (
                payload.category
                and payload.category.strip()
            )
            else "Other"
        ),
        "date": parse_date(payload.date),
        "isAnomaly": False,
    }

    db.expenses.insert_one(expense_doc)

    return ExpenseOut(**expense_doc)


@router.get(
    "/api/expenses",
    response_model=list[ExpenseOut],
)
def get_expenses(
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
    q: str | None = None,
    category: str | None = None,
    start: str | None = None,
    end: str | None = None,
) -> list[ExpenseOut]:

    date_filter: dict[str, Any] = {}

    if start or end:
        if start:
            start_dt = parse_date(start)
            date_filter["$gte"] = start_dt
        if end:
            end_dt = parse_date(end)
            # make end inclusive by setting to end of day
            end_dt = end_dt.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
            date_filter["$lte"] = end_dt
    else:
        now = datetime.now(timezone.utc)

        start_of_month = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        if start_of_month.month == 12:
            end_of_month = start_of_month.replace(
                year=start_of_month.year + 1,
                month=1,
            )
        else:
            end_of_month = start_of_month.replace(
                month=start_of_month.month + 1
            )

        date_filter["$gte"] = start_of_month
        date_filter["$lt"] = end_of_month

    query: dict[str, Any] = {"user": current_user["id"]}
    if date_filter:
        query["date"] = date_filter

    if q:
        # case-insensitive substring match on description
        query["description"] = {"$regex": q, "$options": "i"}

    if category:
        query["category"] = category

    docs = list(db.expenses.find(query).sort("date", -1))

    return [
        ExpenseOut(
            **{
                **doc,
                "_id": str(doc["_id"]),
            }
        )
        for doc in docs
    ]


@router.put(
    "/api/expenses/{expense_id}",
    response_model=ExpenseOut,
)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
) -> ExpenseOut:

    if payload.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid amount",
        )

    if (
        not payload.description
        or not payload.description.strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="Description required",
        )

    update_doc = {
        "amount": payload.amount,
        "description": payload.description,
        "category": payload.category or "Other",
        "date": parse_date(payload.date),
    }

    result = db.expenses.find_one_and_update(
        {
            "_id": expense_id,
            "user": current_user["id"],
        },
        {
            "$set": update_doc,
        },
        return_document=ReturnDocument.AFTER,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    return ExpenseOut(
        **{
            **result,
            "_id": str(result["_id"]),
        }
    )


@router.delete(
    "/api/expenses/{expense_id}",
    response_model=MessageResponse,
)
def delete_expense(
    expense_id: str,
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
) -> MessageResponse:

    result = db.expenses.delete_one({
        "_id": expense_id,
        "user": current_user["id"],
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    return MessageResponse(
        message="Expense deleted"
    )


@router.get("/api/analytics")
def get_analytics(
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    db: Annotated[Any, Depends(get_db)],
) -> list[dict[str, Any]]:

    docs = list(
        db.expenses.aggregate([
            {
                "$match": {
                    "user": current_user["id"],
                },
            },
            {
                "$group": {
                    "_id": "$category",
                    "total": {
                        "$sum": "$amount",
                    },
                },
            },
        ])
    )

    return [
        {
            "_id": doc["_id"],
            "total": doc["total"],
        }
        for doc in docs
    ]
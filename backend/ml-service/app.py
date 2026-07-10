from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from typing import List
import pandas as pd
from model import analyze_expenses

app = FastAPI(title="Expense Insights Service")


class Expense(BaseModel):
    amount: float
    category: str
    date: str

    @field_validator("amount")
    @classmethod
    def amount_must_be_valid(cls, v):
        if v < 0:
            raise ValueError("amount cannot be negative")
        return v

    @field_validator("category")
    @classmethod
    def category_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("category cannot be empty")
        return v.strip()


class RequestData(BaseModel):
    user_id: str
    expenses: List[Expense]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(data: RequestData):
    if not data.expenses:
        return {"insights": [], "score": 100, "status": "No Data", "forecast": None}

    try:
        df = pd.DataFrame([e.model_dump() for e in data.expenses])
        return analyze_expenses(df, data.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
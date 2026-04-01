from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
from model import analyze_expenses

app = FastAPI()


class Expense(BaseModel):
    amount: float
    category: str
    date: str


class RequestData(BaseModel):
    user_id: str
    expenses: List[Expense]


@app.post("/analyze")
def analyze(data: RequestData):
    df = pd.DataFrame([e.dict() for e in data.expenses])
    return analyze_expenses(df, data.user_id)
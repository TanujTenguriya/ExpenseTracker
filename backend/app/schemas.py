from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ExpenseCreate(BaseModel):
    amount: float
    description: str
    category: str | None = None
    date: str | None = None


class ExpenseUpdate(BaseModel):
    amount: float
    description: str
    category: str | None = None
    date: str | None = None


class ExpenseOut(BaseModel):
    id: str = Field(..., alias="_id")
    user: str
    amount: float
    description: str
    category: str
    date: datetime
    isAnomaly: bool = False

    model_config = {
        "populate_by_name": True,
    }


class AuthResponse(BaseModel):
    token: str
    user: dict[str, Any]


class MessageResponse(BaseModel):
    message: str
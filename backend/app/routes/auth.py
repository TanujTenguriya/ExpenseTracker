from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.schemas import (
    AuthResponse,
    MessageResponse,
    UserCreate,
    UserLogin,
)
from app.utils.auth import (
    create_access_token,
    hash_password,
    validate_password,
    verify_password,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    db: Annotated[Any, Depends(get_db)],
) -> MessageResponse:

    if not payload.email or "@" not in payload.email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email",
        )

    if not validate_password(payload.password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least 8 characters "
                "with uppercase, lowercase, numbers, and symbols"
            ),
        )

    normalized_email = payload.email.lower()

    existing = db.users.find_one({
        "email": normalized_email,
    })

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already exists",
        )

    password_hash = hash_password(
        payload.password
    )

    user_id = uuid4().hex

    db.users.insert_one({
        "_id": user_id,
        "name": payload.name,
        "email": normalized_email,
        "password": password_hash,
    })

    return MessageResponse(
        message="User registered successfully"
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    payload: UserLogin,
    db: Annotated[Any, Depends(get_db)],
) -> AuthResponse:

    normalized_email = payload.email.lower()

    user = db.users.find_one({
        "email": normalized_email,
    })

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials",
        )

    if not verify_password(
        payload.password,
        user["password"],
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid credentials",
        )

    token = create_access_token(
        str(user["_id"])
    )

    return AuthResponse(
        token=token,
        user={
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        },
    )
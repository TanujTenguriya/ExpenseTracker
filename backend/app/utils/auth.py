import os
import re
from typing import Annotated, Any

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status

from app.database import get_db


load_dotenv()


JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "supersecret_jwt_key_12345",
)


def validate_password(password: str) -> bool:

    return bool(
        re.search(r"[A-Z]", password)
        and re.search(r"[a-z]", password)
        and re.search(r"[0-9]", password)
        and re.search(r"[^A-Za-z0-9]", password)
        and len(password) >= 8
    )


def hash_password(password: str) -> str:

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:

    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(user_id: str) -> str:

    return jwt.encode(
        {"id": user_id},
        JWT_SECRET,
        algorithm="HS256",
    )


def get_current_user(
    request: Request,
    db: Annotated[Any, Depends(get_db)],
) -> dict[str, Any]:

    auth_header = request.headers.get(
        "authorization",
        "",
    )

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
        )

    except jwt.PyJWTError as exc:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc

    user = db.users.find_one({
        "_id": payload["id"],
    })

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }
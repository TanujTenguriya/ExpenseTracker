from fastapi import (
    FastAPI,
    HTTPException,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import auth, expenses, insights


app = FastAPI(
    title="Expense Tracker API"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(
    _: Request,
    exc: HTTPException,
) -> JSONResponse:

    detail = exc.detail

    if isinstance(detail, dict):
        message = (
            detail.get("message")
            or detail.get("detail")
            or "Request failed"
        )

    else:
        message = (
            detail
            if isinstance(detail, str)
            else "Request failed"
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": message,
        },
    )


@app.get("/")
def health() -> dict[str, str]:

    return {
        "message": "Expense Tracker API running 🚀"
    }


app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(insights.router)
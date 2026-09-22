from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.auth_schema import LoginRequest
from app.services.auth_service import authenticate_user


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        token = authenticate_user(db, data)

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.user_schema import UsuarioCreate
from app.services.user_service import create_user


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"]
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db)
):
    try:

        usuario = create_user(
            db,
            data
        )

        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "cargo": usuario.cargo
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )
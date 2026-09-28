from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user_model import Usuario
from app.schemas.comanda_schema import (
    ComandaCreate,
    ComandaResponse_criar,
    ComandaResponse_listar
)
from app.services.comanda_service import create_comanda, get_all_comandas


router = APIRouter(
    prefix="/comandas",
    tags=["Comandas"]
)


@router.post(
    "",
    response_model=ComandaResponse_criar,
    status_code=status.HTTP_201_CREATED
)
def abrir_comanda(
    data: ComandaCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user)
):
    return create_comanda(
        db=db,
        data=data,
        usuario_id=usuario_atual.id
    )

@router.get(
    "",
    response_model=list[ComandaResponse_listar]
)
def listar_comandas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    return get_all_comandas(db)
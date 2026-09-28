from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user_model import Usuario
from app.schemas.item_comanda_schema import (
    ItemComandaCreate,
    ItemComandaResponse_criar,
    ItemComandaResponse_listar
)
from app.services import item_comanda_service


router = APIRouter(
    prefix="/comandas",
    tags=["Comandas"]
)


@router.post(
    "/{comanda_id}/itens",
    response_model=ItemComandaResponse_criar,
    status_code=201
)
def adicionar_item(
    comanda_id: int,
    dados: ItemComandaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    try:
        return item_comanda_service.adicionar_item(
            db=db,
            comanda_id=comanda_id,
            dados=dados,
            usuario_id=usuario.id
        )

    except ValueError as erro:
        mensagem = str(erro)

        if mensagem in ("Comanda não encontrada", "Produto não encontrado"):
            raise HTTPException(
                status_code=404,
                detail=mensagem
            )

        raise HTTPException(
            status_code=400,
            detail=mensagem
        )

@router.get(
    "/{comanda_id}/itens",
    response_model=list[ItemComandaResponse_listar]
)
def listar_itens(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    try:
        return item_comanda_service.listar_itens(
            db=db,
            comanda_id=comanda_id
        )

    except ValueError as erro:
        raise HTTPException(
            status_code=404,
            detail=str(erro)
        )

@router.delete(
    "/{comanda_id}/itens/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def deletar_item(
    comanda_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    try:
        item_comanda_service.deletar_item(
            db=db,
            comanda_id=comanda_id,
            item_id=item_id
        )

        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except ValueError as erro:
        mensagem = str(erro)

        if mensagem in (
            "Comanda não encontrada",
            "Item não encontrado nesta comanda",
            "Produto associado não encontrado"
        ):
            raise HTTPException(
                status_code=404,
                detail=mensagem
            )

        raise HTTPException(
            status_code=400,
            detail=mensagem
        )
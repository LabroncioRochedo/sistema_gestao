from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user_model import Usuario
from app.schemas.comanda_schema import (
    ComandaCreate,
    ComandaEncerrada,
    ComandaResponse_criar,
    ComandaResponse_listar,
    ComandaResponse_historico,
    ComandaPagamentosResponse_listar
)
from app.repositories.comanda_repository import NumeroComandaEmUso
from app.repositories import comanda_repository
from app.services import comanda_service


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
    try:
        return comanda_service.create_comanda(db=db, data=data, usuario_id=usuario_atual.id)
    except NumeroComandaEmUso as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro)) from erro

@router.get(
    "",
    response_model=list[ComandaResponse_listar]
)
def listar_comandas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    return comanda_service.get_all_comandas(db)

@router.get("/historico", response_model=list[ComandaEncerrada])
def listar_historico(
    inicio: int = Query(0, ge=0), limite: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user),
):
    return comanda_repository.listar_encerradas(db, inicio, limite)


@router.get(
    "/{comanda_id}"
)
def pegar_comanda(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    return comanda_service.get_comanda(db=db,comanda_id=comanda_id)

@router.delete("/{comanda_id}")
def deletar_comanda(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user)
):
    try:
        comanda_service.deletar_comanda(
            usuario=usuario_atual,
            db=db,
            comanda_id=comanda_id
        )

        return {
            "mensagem": "Comanda e itens excluídos. Estoque restaurado."
        }

    except ValueError as erro:
        mensagem = str(erro)

        if mensagem == "Comanda não encontrada":
            raise HTTPException(
                status_code=404,
                detail=mensagem
            )

        raise HTTPException(
            status_code=400,
            detail=mensagem
        )

@router.get(
    "/{comanda_id}/historico",
    response_model=list[ComandaResponse_historico]
)
def pegar_historico(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    return comanda_service.pegar_historico(db=db,comanda_id=comanda_id)

@router.get(
    "/{comanda_id}/pagamentos",
    response_model=list[ComandaPagamentosResponse_listar]
)
def listar_pagamentos_comanda(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    return comanda_service.listar_pagamentos_comanda(
        db=db,
        comanda_id=comanda_id
    )
from fastapi import Depends, HTTPException, APIRouter, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user_model import Usuario
from app.schemas.venda_schema import VendaCreate, VendaResponse_vender, VendaDiretaCreate, ItemVendaResponse_listar, VendaResponse_listar
from app.services import venda_service

router = APIRouter(
    prefix="",
    tags=["Comandas"]
)

@router.post(
    "/comandas/{comanda_id}/vender",
    response_model=VendaResponse_vender,
    status_code=201
)
def vender_comanda(
    comanda_id: int,
    dados: VendaCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(get_current_user)
):
    try:
        return venda_service.vender_comanda(
            db=db,
            comanda_id=comanda_id,
            usuario_id=usuario_atual.id,
            forma_pagamento=dados.forma_pagamento
        )

    except ValueError as erro:
        mensagem = str(erro)

        if mensagem == "Comanda não encontrada":
            raise HTTPException(status_code=404, detail=mensagem)

        raise HTTPException(status_code=400, detail=mensagem)

@router.post(
    "/vendas/direta",
    status_code=status.HTTP_201_CREATED,
)
def vender_produto_direto(
    dados: VendaDiretaCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    try:
        return venda_service.vender_produto_direto(
            db=db,
            produto_id=dados.produto_id,
            quantidade=dados.quantidade,
            usuario_id=usuario.id,
            forma_pagamento=dados.forma_pagamento,
        )
    except ValueError as erro:
        mensagem = str(erro)
        codigo = (
            status.HTTP_404_NOT_FOUND
            if mensagem == "Produto não encontrado"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=codigo,
            detail=mensagem,
        )

@router.get(
    "/vendas",
    response_model=list[VendaResponse_listar]
)
def listar_vendas(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    return venda_service.listar_vendas(db)


@router.get(
    "/vendas/{venda_id}/itens",
    response_model=list[ItemVendaResponse_listar]
)
def listar_itens_venda(
    venda_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    try:
        return venda_service.listar_itens_venda(
            db, venda_id
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=404,
            detail=str(erro)
        )
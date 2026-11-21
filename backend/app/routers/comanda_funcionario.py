from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.database import get_db
from app.models.comanda_funcionario import ComandaFuncionario, ItemComandaFuncionario
from app.models.lote_model import Lote
from app.models.product_model import Produto
from app.models.user_model import Usuario
from app.schemas.comanda_funcionario import AnotarOutro, AnotarProduto, AnotarProdutos, EncerrarConta, ContaFuncionarioResponse
from app.repositories.estoque import consumir_lotes

router = APIRouter(prefix="/comandas-funcionarios", tags=["Comandas de funcionários"])


def verificar_acesso(funcionario_id: int, usuario: Usuario = Depends(get_current_user)):
    if usuario.cargo != "admin" and not (usuario.cargo == "funcionario" and usuario.id == funcionario_id):
        raise HTTPException(403, "Você não tem acesso a esta comanda.")
    return usuario


def obter_conta(db, funcionario_id, *, bloquear=False):
    consulta = select(ComandaFuncionario).where(ComandaFuncionario.funcionario_id == funcionario_id)
    if bloquear:
        consulta = consulta.with_for_update()
    conta = db.scalar(consulta)
    if conta is None:
        raise HTTPException(404, "Comanda de funcionário não encontrada.")
    return conta


@router.get("/{funcionario_id}", response_model=ContaFuncionarioResponse)
def visualizar(funcionario_id: int, usuario: Usuario = Depends(verificar_acesso), db: Session = Depends(get_db)):
    return obter_conta(db, funcionario_id)


@router.post("/{funcionario_id}/produtos", status_code=201, response_model=ContaFuncionarioResponse)
def anotar_produto(funcionario_id: int, dados: AnotarProdutos | AnotarProduto, usuario: Usuario = Depends(verificar_acesso), db: Session = Depends(get_db)):
    conta = obter_conta(db, funcionario_id, bloquear=True)
    itens = dados.itens if isinstance(dados, AnotarProdutos) else [dados]
    quantidades: dict[int, int] = {}
    for item in itens:
        quantidades[item.produto_id] = quantidades.get(item.produto_id, 0) + item.quantidade

    # A ordem estável evita que duas comandas bloqueiem os mesmos produtos em ordem inversa.
    for produto_id in sorted(quantidades):
        produto = db.get(Produto, produto_id)
        if produto is None:
            raise HTTPException(404, "Produto não encontrado.")
        try:
            consumos = consumir_lotes(db, produto, quantidades[produto_id])
        except ValueError as erro:
            raise HTTPException(409, str(erro)) from erro
        for lote, quantidade in consumos:
            db.add(ItemComandaFuncionario(funcionario_id=funcionario_id, lote_id=lote.id,
                nome=produto.nome, quantidade=quantidade, preco_unitario=produto.preco, anotado_por=usuario.nome))
    db.commit()
    return conta


@router.post("/{funcionario_id}/outros", status_code=201, response_model=ContaFuncionarioResponse)
def anotar_outro(funcionario_id: int, dados: AnotarOutro, usuario: Usuario = Depends(verificar_acesso), db: Session = Depends(get_db)):
    conta = obter_conta(db, funcionario_id, bloquear=True)
    db.add(ItemComandaFuncionario(funcionario_id=funcionario_id, anotado_por=usuario.nome, **dados.model_dump()))
    db.commit()
    return conta


@router.delete("/{funcionario_id}/itens/{item_id}", status_code=204)
def remover(funcionario_id: int, item_id: int, admin: Usuario = Depends(require_admin), db: Session = Depends(get_db)):
    obter_conta(db, funcionario_id, bloquear=True)
    item = db.scalar(select(ItemComandaFuncionario).where(
        ItemComandaFuncionario.funcionario_id == funcionario_id, ItemComandaFuncionario.id == item_id))
    if item is None:
        raise HTTPException(404, "Item não encontrado nesta comanda.")
    if item.lote_id is not None:
        lote = db.get_one(Lote, item.lote_id, with_for_update=True)
        lote.quantidade += item.quantidade
    db.delete(item)
    db.commit()
    return Response(status_code=204)

@router.post("/{funcionario_id}/encerrar", status_code=204)
def encerrar(funcionario_id: int, dados: EncerrarConta, admin: Usuario = Depends(require_admin),
             db: Session = Depends(get_db)):
    conta = obter_conta(db, funcionario_id, bloquear=True)
    if not conta.itens or {item.id for item in conta.itens} != set(dados.itens_ids):
        raise HTTPException(409, "A comanda mudou. Confira os itens antes de encerrar.")

    # A baixa de estoque já ocorreu na anotação; o encerramento apenas quita o consumo.
    db.execute(delete(ItemComandaFuncionario).where(ItemComandaFuncionario.funcionario_id == funcionario_id))
    db.commit()
    return Response(status_code=204)

from datetime import datetime, timezone

from sqlalchemy.orm import Session,selectinload
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.comanda_model import Comanda
from app.models.item_comanda_model import ItemComanda
from app.models.historico_comanda_model import HistoricoComanda
from app.models.user_model import Usuario
from app.models.lote_model import Lote
from app.models.historico_itens_model import HistoricoItemComanda
from app.models.pagamento_comanda import PagamentoComanda


class NumeroComandaEmUso(ValueError):
    pass


def create(db: Session, comanda: Comanda) -> Comanda:
    db.add(comanda)
    try:
        db.flush()
        db.add(HistoricoComanda(comanda_id=comanda.id, nome=comanda.nome,
                                numero=comanda.numero, status=comanda.status))
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        diagnostico = getattr(erro.orig, "diag", None)
        if getattr(diagnostico, "constraint_name", None) == "uq_comandas_numero":
            raise NumeroComandaEmUso("Este número de comanda já está em uso.") from erro
        raise
    db.refresh(comanda)

    return comanda


def get_by_id(db: Session, comanda_id: int) -> Comanda | None:
    return db.get(Comanda, comanda_id) 

def get_all(db: Session):
    comando = (
        select(Comanda)
        .options(selectinload(Comanda.usuario))
    )

    return db.scalars(comando).all()

def get_comanda(
    db: Session,
    comanda_id: int
):
    return (
        db.query(Comanda)
        .filter(Comanda.id == comanda_id)
        .first()
    )

def encerrar_historico(db: Session, comanda_id: int, status: str):
    historico = db.get_one(HistoricoComanda, comanda_id)
    historico.status = status
    historico.data_encerramento = datetime.now(timezone.utc)


def listar_encerradas(db: Session, inicio: int, limite: int):
    return db.scalars(
        select(HistoricoComanda)
        .where(HistoricoComanda.data_encerramento.is_not(None))
        .options(selectinload(HistoricoComanda.anotacoes))
        .order_by(HistoricoComanda.data_encerramento.desc(), HistoricoComanda.comanda_id.desc())
        .offset(inicio).limit(limite)
    ).all()


def registrar_saida(db: Session, item: ItemComanda, usuario: Usuario):
    db.add(HistoricoItemComanda(
        comanda_id=item.comanda_id, nome_produto=item.nome_produto,
        usuario_id=usuario.id, nome_usuario=usuario.nome, quantidade=item.quantidade,
        preco_unitario=item.preco_unitario, comentario=item.comentario, operacao="saida",
    ))


def deletar_comanda(db, comanda_id: int, usuario: Usuario):
    try:
        # Bloqueia a comanda durante a operação
        comanda = db.execute(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        ).scalar_one_or_none()

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError(
                "Não é possível excluir uma comanda que não está aberta"
            )

        # Busca os itens da comanda
        itens = db.execute(
            select(ItemComanda)
            .where(ItemComanda.comanda_id == comanda_id)
            .order_by(ItemComanda.produto_id)
            .with_for_update()
        ).scalars().all()

        # Agrupa as quantidades por produto
        quantidades = {}

        for item in itens:
            registrar_saida(db, item, usuario)
            if item.lote_id is not None:
                quantidades[item.lote_id] = quantidades.get(item.lote_id, 0) + item.quantidade

        # Bloqueia os produtos em ordem consistente
        produtos = {}

        for lote_id in sorted(quantidades):
            produto = db.execute(
                select(Lote)
                .where(Lote.id == lote_id)
                .with_for_update()
            ).scalar_one_or_none()

            if produto is None:
                raise ValueError(
                    f"Lote {lote_id} não encontrado"
                )

            produtos[lote_id] = produto

        # Devolve as quantidades ao estoque
        for lote_id, quantidade in quantidades.items():
            produtos[lote_id].quantidade += quantidade

        # Exclui os itens e a comanda
        for item in itens:
            db.delete(item)

        encerrar_historico(db, comanda_id, "excluida")
        db.delete(comanda)

        db.commit()
        return True

    except Exception:
        db.rollback()
        raise

def pegar_historico(
    db,
    comanda_id: int
    ):

    historico = db.scalars(
        select(HistoricoItemComanda)
        .where(HistoricoItemComanda.comanda_id == comanda_id)
        .order_by(HistoricoItemComanda.data_movimentacao.desc(), HistoricoItemComanda.id.desc())
    ).all()

    return historico

def listar_pagamentos_comanda(
    db: Session,
    comanda_id: int
):
    return db.scalars(
        select(PagamentoComanda)
        .where(PagamentoComanda.comanda_id == comanda_id)
        .order_by(PagamentoComanda.data_pagamento.desc())
    ).all()
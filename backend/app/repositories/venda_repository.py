from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.comanda_model import Comanda
from app.models.item_comanda_model import ItemComanda
from app.models.product_model import Produto
from app.models.venda_model import Venda
from app.models.item_venda_model import ItemVenda


def vender_comanda(
    db: Session,
    comanda_id: int,
    usuario_id: int,
    forma_pagamento: str
):
    try:
        comanda = db.execute(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        ).scalar_one_or_none()

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError("Comanda não está aberta")

        itens = db.execute(
            select(ItemComanda)
            .where(ItemComanda.comanda_id == comanda_id)
            .order_by(ItemComanda.id)
            .with_for_update()
        ).scalars().all()

        if not itens:
            raise ValueError("Não é possível vender uma comanda vazia")

        valor_total = sum(
            (
                Decimal(str(item.preco_unitario))
                * item.quantidade
                for item in itens
            ),
            Decimal("0.00")
        )

        venda = Venda(
            usuario_id=usuario_id,
            valor_total=valor_total,
            forma_pagamento=forma_pagamento,
            data_venda=datetime.now(timezone.utc)
        )

        db.add(venda)
        db.flush()

        for item in itens:
            item_venda = ItemVenda(
                venda_id=venda.id,
                produto_id=item.produto_id,
                usuario_id=item.usuario_id,
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario
            )
            db.add(item_venda)

        # Garante que os registros históricos foram inseridos
        db.flush()

        # Exclui os itens temporários e a comanda
        for item in itens:
            db.delete(item)

        db.delete(comanda)

        db.commit()
        db.refresh(venda)

        return venda

    except Exception:
        db.rollback()
        raise

def vender_produto_direto(
    db: Session,
    produto_id: int,
    quantidade: int,
    usuario_id: int,
    forma_pagamento: str,
):
    try:
        produto = db.scalar(
            select(Produto)
            .where(Produto.id == produto_id)
            .with_for_update()
        )

        if produto is None:
            raise ValueError("Produto não encontrado")

        if quantidade <= 0:
            raise ValueError("A quantidade deve ser maior que zero")

        if produto.quantidade < quantidade:
            raise ValueError("Estoque insuficiente")

        preco_unitario = Decimal(str(produto.preco))
        valor_total = preco_unitario * quantidade

        venda = Venda(
            usuario_id=usuario_id,
            valor_total=valor_total,
            forma_pagamento=forma_pagamento,
            data_venda=datetime.now(timezone.utc),
        )

        db.add(venda)
        db.flush()

        item = ItemVenda(
            venda_id=venda.id,
            produto_id=produto.id,
            usuario_id=usuario_id,
            quantidade=quantidade,
            preco_unitario=preco_unitario,
        )

        produto.quantidade -= quantidade

        db.add(item)
        db.commit()
        db.refresh(venda)

        return venda

    except Exception:
        db.rollback()
        raise

def listar_vendas(db):
    stmt = (
        select(Venda)
        .options(
            selectinload(Venda.usuario)
        )
        .order_by(Venda.data_venda.desc())
    )

    return db.scalars(stmt).all()


def buscar_venda_por_id(db, venda_id: int):
    stmt = select(Venda).where(
        Venda.id == venda_id
    )

    return db.scalar(stmt)


def listar_itens_venda(db, venda_id: int):
    stmt = (
        select(ItemVenda)
        .where(ItemVenda.venda_id == venda_id)
        .options(
            selectinload(ItemVenda.produto),
            selectinload(ItemVenda.usuario)
        )
        .order_by(ItemVenda.id)
    )

    return db.scalars(stmt).all()
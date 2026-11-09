from datetime import datetime, timezone, date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user_model import Usuario
from app.models.comanda_model import Comanda
from app.models.item_comanda_model import ItemComanda
from app.models.product_model import Produto
from app.models.venda_model import Venda
from app.models.item_venda_model import ItemVenda
from app.models.lote_model import Lote


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

        usuario = db.scalar(
            select(Usuario)
            .where(Usuario.id == usuario_id)
        )

        venda = Venda(
            nome_usuario=usuario.nome,
            nome_venda=comanda.nome,
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
                nome_usuario=usuario.nome,
                nome_produto=item.nome_produto,
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

def vender_produtos_direto(
    db: Session,
    itens: list[VendaDiretaCreate],
    usuario_id: int,
    forma_pagamento: str,
):
    try:
        valor_total = Decimal("0.00")

        usuario = db.scalar(
            select(Usuario)
            .where(Usuario.id == usuario_id)
        )

        # Cria uma única venda
        venda = Venda(
            nome_usuario=usuario,
            nome_venda="caixa",
            valor_total=valor_total,
            forma_pagamento=forma_pagamento,
            data_venda=datetime.now(timezone.utc),
        )

        db.add(venda)
        db.flush()

        # Percorre os produtos recebidos
        for dados_item in itens:

            produto = db.scalar(
                select(Produto)
                .where(Produto.id == dados_item.produto_id)
            )

            if produto is None:
                raise ValueError(
                    f"Produto {dados_item.produto_id} não encontrado"
                )

            # Busca e bloqueia os lotes válidos
            lotes = db.scalars(
                select(Lote)
                .where(
                    Lote.produto_id == produto.id,
                    Lote.quantidade > 0,
                    Lote.data_de_validade >= date.today()
                )
                .order_by(
                    Lote.data_de_validade.asc(),
                    Lote.id.asc()
                )
                .with_for_update()
            ).all()

            estoque_disponivel = sum(
                lote.quantidade for lote in lotes
            )

            if estoque_disponivel < dados_item.quantidade:
                raise ValueError(
                    f"Estoque insuficiente para o produto {produto.nome}"
                )

            preco_unitario = Decimal(str(produto.preco))

            quantidade_restante = dados_item.quantidade

            # Consome o estoque dos lotes
            for lote in lotes:

                if quantidade_restante == 0:
                    break

                quantidade_utilizada = min(
                    lote.quantidade,
                    quantidade_restante
                )

                lote.quantidade -= quantidade_utilizada
                quantidade_restante -= quantidade_utilizada

            # Cria somente um registro para o produto
            item = ItemVenda(
                venda_id=venda.id,
                produto_id=produto.id,
                nome_usuario=usuario.nome,
                nome_produto=produto.nome,
                quantidade=dados_item.quantidade,
                preco_unitario=preco_unitario,
            )

            db.add(item)

            # Calcula o valor total
            valor_total += (
                preco_unitario * dados_item.quantidade
            )

        venda.valor_total = valor_total

        db.commit()
        db.refresh(venda)

        return venda

    except Exception:
        db.rollback()
        raise

def listar_vendas(db):
    stmt = (
        select(Venda)
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
        .order_by(ItemVenda.id)
    )

    return db.scalars(stmt).all()
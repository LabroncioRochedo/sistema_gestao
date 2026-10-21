from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from datetime import date

from app.models.comanda_model import Comanda
from app.models.product_model import Produto
from app.models.item_comanda_model import ItemComanda
from app.models.lote_model import Lote


from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comanda_model import Comanda
from app.models.product_model import Produto
from app.models.lote_model import Lote
from app.models.item_comanda_model import ItemComanda


def adicionar_item(
    db: Session,
    comanda_id: int,
    produto_id: int,
    usuario_id: int,
    quantidade: int,
    comentario: str | None
) -> list[ItemComanda]:

    try:

        # Busca e bloqueia a comanda
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError(
                "Não é possível adicionar itens a uma comanda fechada"
            )

        # Verifica se o produto existe
        produto = db.scalar(
            select(Produto)
            .where(Produto.id == produto_id)
        )

        if produto is None:
            raise ValueError("Produto não encontrado")

        # Busca os lotes com estoque, do que vence primeiro
        # para o que vence por último, bloqueando as linhas.
        lotes = db.scalars(
            select(Lote)
            .where(
                Lote.produto_id == produto_id,
                Lote.quantidade > 0,
                Lote.data_de_validade >= __import__("datetime").date.today()
            )
            .order_by(
                Lote.data_de_validade.asc(),
                Lote.id.asc()
            )
            .with_for_update()
        ).all()

        estoque_disponivel = sum(lote.quantidade for lote in lotes)

        if estoque_disponivel < quantidade:
            raise ValueError("Estoque insuficiente nos lotes válidos")

        quantidade_restante = quantidade
        itens_criados = []

        # Consome primeiro o lote que vence mais cedo.
        for lote in lotes:
            if quantidade_restante == 0:
                break

            quantidade_utilizada = min(
                lote.quantidade,
                quantidade_restante
            )

            lote.quantidade -= quantidade_utilizada
            quantidade_restante -= quantidade_utilizada

            item = ItemComanda(
                comanda_id=comanda_id,
                produto_id=produto_id,
                lote_id=lote.id,
                usuario_id=usuario_id,
                quantidade=quantidade_utilizada,
                preco_unitario=produto.preco,
                comentario=comentario
            )

            db.add(item)
            itens_criados.append(item)

        db.commit()

        for item in itens_criados:
            db.refresh(item)

        return itens_criados

    except Exception:
        db.rollback()
        raise

def listar_itens(
    db: Session,
    comanda_id: int
) -> list[ItemComanda]:

    comando = (
        select(ItemComanda)
        .where(ItemComanda.comanda_id == comanda_id)
        .options(
            selectinload(ItemComanda.produto),
            selectinload(ItemComanda.usuario)
        )
        .order_by(ItemComanda.id)
    )

    return db.scalars(comando).all()


def deletar_item(
    db: Session,
    comanda_id: int,
    item_id: int
) -> None:

    try:
        # Busca e bloqueia a comanda
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError(
                "Não é possível alterar uma comanda fechada"
            )

        # Busca e bloqueia somente o item informado
        item = db.scalar(
            select(ItemComanda)
            .where(
                ItemComanda.id == item_id,
                ItemComanda.comanda_id == comanda_id
            )
            .with_for_update()
        )

        if item is None:
            raise ValueError("Item não encontrado nesta comanda")

        # Busca e bloqueia o lote associado ao item
        lote = db.scalar(
            select(Lote)
            .where(Lote.id == item.lote_id)
            .with_for_update()
        )

        if lote is None:
            raise ValueError("Lote associado ao item não encontrado")

        # Devolve a quantidade ao lote original
        lote.quantidade += item.quantidade

        # Remove somente a linha informada
        db.delete(item)

        db.commit()

    except Exception:
        db.rollback()
        raise
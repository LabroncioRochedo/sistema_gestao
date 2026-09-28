from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comanda_model import Comanda
from app.models.product_model import Produto
from app.models.item_comanda_model import ItemComanda


def adicionar_item(
    db: Session,
    comanda_id: int,
    produto_id: int,
    usuario_id: int,
    quantidade: int,
    comentario: str | None
) -> ItemComanda:

    try:
        # Verifica e bloqueia a comanda
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError("Não é possível adicionar itens a uma comanda fechada")

        # Busca e bloqueia o produto
        produto = db.scalar(
            select(Produto)
            .where(Produto.id == produto_id)
            .with_for_update()
        )

        if produto is None:
            raise ValueError("Produto não encontrado")

        if produto.quantidade < quantidade:
            raise ValueError("Estoque insuficiente")

        # Desconta o estoque
        produto.quantidade -= quantidade

        # Cria o item com o preço atual do produto
        item = ItemComanda(
            comanda_id=comanda_id,
            produto_id=produto_id,
            usuario_id=usuario_id,
            quantidade=quantidade,
            preco_unitario=produto.preco,
            comentario=comentario
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        return item

    except Exception:
        db.rollback()
        raise
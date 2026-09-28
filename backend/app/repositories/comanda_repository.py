from sqlalchemy.orm import Session,selectinload
from sqlalchemy import select

from app.models.comanda_model import Comanda
from app.models.item_comanda_model import ItemComanda
from app.models.product_model import Produto


def create(db: Session, comanda: Comanda) -> Comanda:
    db.add(comanda)
    db.commit()
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

def deletar_comanda(db, comanda_id: int):
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
            quantidades[item.produto_id] = (
                quantidades.get(item.produto_id, 0)
                + item.quantidade
            )

        # Bloqueia os produtos em ordem consistente
        produtos = {}

        for produto_id in sorted(quantidades):
            produto = db.execute(
                select(Produto)
                .where(Produto.id == produto_id)
                .with_for_update()
            ).scalar_one_or_none()

            if produto is None:
                raise ValueError(
                    f"Produto {produto_id} não encontrado"
                )

            produtos[produto_id] = produto

        # Devolve as quantidades ao estoque
        for produto_id, quantidade in quantidades.items():
            produtos[produto_id].quantidade += quantidade

        # Exclui os itens e a comanda
        for item in itens:
            db.delete(item)

        db.delete(comanda)

        db.commit()
        return True

    except Exception:
        db.rollback()
        raise
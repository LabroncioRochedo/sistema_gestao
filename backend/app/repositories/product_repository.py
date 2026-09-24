from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product_model import Produto


def get_by_id(
    db: Session,
    produto_id: int
) -> Produto | None:

    statement = select(Produto).where(
        Produto.id == produto_id
    )

    return db.scalar(statement)


def update_image_key(
    db: Session,
    produto: Produto,
    image_key: str
) -> Produto:

    produto.imagem_key = image_key

    db.commit()
    db.refresh(produto)

    return produto


def create(
    db: Session,
    produto: Produto
) -> Produto:

    db.add(produto)
    db.commit()
    db.refresh(produto)

    return produto
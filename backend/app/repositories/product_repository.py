from sqlalchemy.orm import Session

from app.models.product_model import Produto


def create(
    db: Session,
    produto: Produto
) -> Produto:

    db.add(produto)

    db.commit()

    db.refresh(produto)

    return produto
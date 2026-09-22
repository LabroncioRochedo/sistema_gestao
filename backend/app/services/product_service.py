from sqlalchemy.orm import Session

from app.models.product_model import Produto
from app.repositories import product_repository
from app.schemas.product_schema import ProdutoCreate


def create_product(
    db: Session,
    data: ProdutoCreate
) -> Produto:

    produto = Produto(
        nome=data.nome,
        preco=data.preco,
        quantidade=data.quantidade,
        data_de_validade=data.data_de_validade
    )

    return product_repository.create(
        db,
        produto
    )
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.product_model import Produto
from app.repositories import product_repository
from app.schemas.product_schema import ProdutoCreate
from app.services.storage_service import (
    delete_image,
    save_product_image,
)

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

async def update_product_image(
    db: Session,
    produto: Produto,
    imagem: UploadFile
) -> Produto:

    old_image_key = produto.imagem_key

    new_image_key = await save_product_image(
        imagem
    )

    try:
        produto = product_repository.update_image_key(
            db,
            produto,
            new_image_key
        )

    except Exception:
        delete_image(new_image_key)
        raise

    if old_image_key:
        delete_image(old_image_key)

    return produto

def get_all_products(db: Session) -> list[Produto]:
    return product_repository.get_all(db)

def delete_product(
    db: Session,
    produto_id: int
) -> None:

    produto = product_repository.get_by_id(
        db,
        produto_id
    )

    if not produto:
        raise ValueError("Produto não encontrado")

    product_repository.delete(
        db,
        produto
    )
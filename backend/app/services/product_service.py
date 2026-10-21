from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.product_model import Produto
from app.models.lote_model import Lote
from app.repositories import product_repository
from app.schemas.product_schema import ProdutoCreate, LoteCreat
from app.services.storage_service import (
    delete_image,
    save_product_image,
)

def criar_lote(
    db: Session,
    dados: LoteCreatCreate,
    produto_id: int
):
    return product_repository.criar_lote(
        db=db,
        dados=dados,
        produto_id=produto_id
    )

def criar_produto(
    db: Session,
    dados: ProdutoCreate,
):
    return product_repository.criar_produto_com_lote(
        db=db,
        dados=dados,
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

def pegar_lotes_de_um_produto(
    db: Session,
    produto_id: int
):
    return product_repository.pegar_lotes_de_um_produto(
        db=db,
        produto_id=produto_id
    )

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
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.product_schema import ProdutoCreate
from app.services.product_service import create_product


router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def create_produto(
    data: ProdutoCreate,
    db: Session = Depends(get_db)
):

    produto = create_product(
        db,
        data
    )

    return {
        "id": produto.id,
        "nome": produto.nome,
        "preco": produto.preco,
        "quantidade": produto.quantidade,
        "data_de_validade": produto.data_de_validade
    }
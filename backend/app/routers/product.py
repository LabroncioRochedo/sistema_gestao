from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.product_schema import ProdutoCreate
from app.services.product_service import create_product
from app.models.user_model import Usuario
from app.dependencies.auth import require_admin


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
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_admin)
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
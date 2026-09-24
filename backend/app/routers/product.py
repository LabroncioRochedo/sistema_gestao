from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.product_schema import ProdutoCreate
from app.services.product_service import create_product
from app.models.user_model import Usuario
from app.dependencies.auth import require_admin
from app.repositories import product_repository
from app.services.product_service import update_product_image

from pathlib import Path

from fastapi.responses import FileResponse

from app.services.storage_service import get_file_path

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

@router.post(
    "/{produto_id}/imagem",
    status_code=status.HTTP_200_OK
)
async def upload_produto_imagem(
    produto_id: int,
    imagem: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_admin)
):
    produto = product_repository.get_by_id(
        db,
        produto_id
    )

    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    try:
        produto = await update_product_image(
            db,
            produto,
            imagem
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    return {
        "id": produto.id,
        "imagem_url": f"/produtos/{produto.id}/imagem"
    }

IMAGE_MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

@router.get("/{produto_id}/imagem")
def get_produto_imagem(
    produto_id: int,
    db: Session = Depends(get_db)
):
    produto = product_repository.get_by_id(
        db,
        produto_id
    )

    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    if not produto.imagem_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não possui imagem"
        )

    try:
        file_path = get_file_path(
            produto.imagem_key
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Caminho da imagem inválido"
        )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo da imagem não encontrado"
        )

    extension = Path(file_path).suffix.lower()

    media_type = IMAGE_MEDIA_TYPES.get(
        extension
    )

    if not media_type:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tipo de imagem inválido"
        )

    return FileResponse(
        path=file_path,
        media_type=media_type
    )
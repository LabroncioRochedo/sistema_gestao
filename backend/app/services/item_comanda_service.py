from sqlalchemy.orm import Session

from app.models.item_comanda_model import ItemComanda
from app.repositories import item_comanda_repository
from app.schemas.item_comanda_schema import ItemComandaCreate


def adicionar_item(
    db: Session,
    comanda_id: int,
    dados: ItemComandaCreate,
    usuario_id: int
) -> ItemComanda:

    return item_comanda_repository.adicionar_item(
        db=db,
        comanda_id=comanda_id,
        produto_id=dados.produto_id,
        usuario_id=usuario_id,
        quantidade=dados.quantidade,
        comentario=dados.comentario
    )
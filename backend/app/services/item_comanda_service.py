from sqlalchemy.orm import Session

from app.models.item_comanda_model import ItemComanda
from app.repositories import item_comanda_repository
from app.repositories import comanda_repository
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

def listar_itens(
    db: Session,
    comanda_id: int
) -> list[ItemComanda]:

    comanda = comanda_repository.get_by_id(
        db,
        comanda_id
    )

    if comanda is None:
        raise ValueError("Comanda não encontrada")

    return item_comanda_repository.listar_itens(
        db,
        comanda_id
    )

def deletar_item(
    db: Session,
    comanda_id: int,
    item_id: int
) -> None:

    item_comanda_repository.deletar_item(
        db=db,
        comanda_id=comanda_id,
        item_id=item_id
    )
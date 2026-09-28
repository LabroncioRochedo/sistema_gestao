from sqlalchemy.orm import Session

from app.models.comanda_model import Comanda
from app.repositories import comanda_repository
from app.schemas.comanda_schema import ComandaCreate


def create_comanda(db: Session,data: ComandaCreate, usuario_id: int) -> Comanda:
    comanda = Comanda(
        usuario_id=usuario_id,
        nome=data.nome,
        status="aberta"
    )

    return comanda_repository.create(db, comanda)
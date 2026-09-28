from sqlalchemy.orm import Session

from app.models.comanda_model import Comanda


def create(db: Session, comanda: Comanda) -> Comanda:
    db.add(comanda)
    db.commit()
    db.refresh(comanda)

    return comanda


def get_by_id(db: Session, comanda_id: int) -> Comanda | None:
    return db.get(Comanda, comanda_id)
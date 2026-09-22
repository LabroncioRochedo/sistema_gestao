from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_model import Usuario


def get_by_name(
    db: Session,
    nome: str
) -> Usuario | None:

    statement = select(Usuario).where(
        Usuario.nome == nome
    )

    return db.scalar(statement)


def create(
    db: Session,
    usuario: Usuario
) -> Usuario:

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario
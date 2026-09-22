from sqlalchemy.orm import Session

from app.models.user_model import Usuario
from app.repositories import user_repository
from app.schemas.user_schema import UsuarioCreate
from app.core.security import hash_password


def create_user(
    db: Session,
    data: UsuarioCreate
) -> Usuario:

    existing_user = user_repository.get_by_name(
        db,
        data.nome
    )

    if existing_user:
        raise ValueError("Usuário já existe")

    hashed_password = hash_password(data.senha)

    usuario = Usuario(
        nome=data.nome,
        senha=hashed_password,
        cargo="funcionario"
    )

    return user_repository.create(
        db,
        usuario
    )
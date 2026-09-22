from sqlalchemy.orm import Session

from app.repositories import user_repository
from app.schemas.auth_schema import LoginRequest
from app.core.security import create_access_token
from app.core.security import verify_password


def authenticate_user(
    db: Session,
    data: LoginRequest
) -> str:

    usuario = user_repository.get_by_name(
        db,
        data.nome
    )

    if not usuario:
        raise ValueError("Usuário ou senha inválidos")

    senha_valida = verify_password(
        data.senha,
        usuario.senha
    )

    if not senha_valida:
        raise ValueError("Usuário ou senha inválidos")

    return create_access_token(usuario.id,usuario.cargo)
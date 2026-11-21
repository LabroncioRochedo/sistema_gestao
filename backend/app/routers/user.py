from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.user_schema import UsuarioCreate
from app.services.user_service import create_user,get_funcionarios,delete_user
from app.models.user_model import Usuario
from app.dependencies.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"]
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_admin)
):
    try:

        usuario = create_user(
            db,
            data
        )

        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "cargo": usuario.cargo
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

@router.get("/me")
def perfil(usuario: Usuario = Depends(get_current_user)):
    return {"id": usuario.id, "nome": usuario.nome, "cargo": usuario.cargo}


@router.get("/funcionarios") 
def listar_funcionarios( db: Session = Depends(get_db), usuario_atual: Usuario = Depends(require_admin) ): 
    usuarios = get_funcionarios(db) 
    return [ { "id": usuario.id, "nome": usuario.nome, "cargo": usuario.cargo } for usuario in usuarios ]

@router.delete("/{usuario_id}")
def excluir_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(require_admin)
):
    try:
        delete_user(
            db,
            usuario_id
        )

        return {
            "message": "Usuário excluído com sucesso"
        }

    except IntegrityError as erro:
        db.rollback()
        if getattr(getattr(erro.orig, "diag", None), "constraint_name", None) == "fk_item_conta_funcionario":
            raise HTTPException(409, "Remova as anotações da comanda antes de excluir o funcionário.") from erro
        raise
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product_model import Produto
from app.models.lote_model import Lote
from app.schemas.product_schema import ProdutoCreate


def get_by_id(
    db: Session,
    produto_id: int
) -> Produto | None:

    statement = select(Produto).where(
        Produto.id == produto_id
    )

    return db.scalar(statement)


def update_image_key(
    db: Session,
    produto: Produto,
    image_key: str
) -> Produto:

    produto.imagem_key = image_key

    db.commit()
    db.refresh(produto)

    return produto


def criar_produto_com_lote(
    db: Session,
    dados: ProdutoCreate,
) -> Produto:
    try:
        # 1. Criar o produto
        produto = Produto(
            nome=dados.nome,
            preco=dados.preco,
        )

        db.add(produto)

        # 2. Enviar o INSERT para obter o ID gerado
        # sem confirmar a transação ainda.
        db.flush()

        # Neste ponto, produto.id já está disponível.
        lote = Lote(
            produto_id=produto.id,
            quantidade=dados.quantidade,
            data_de_validade=dados.data_de_validade,
        )

        db.add(lote)

        # 3. Persistir ambos juntos
        db.commit()

        # Atualizar os objetos com os dados do banco.
        db.refresh(produto)
        db.refresh(lote)

        return produto,lote

    except Exception:
        db.rollback()
        raise

def get_all(db: Session) -> list[Produto]:
    statement = select(Produto)

    return db.scalars(statement).all()

def delete(
    db: Session,
    produto: Produto
) -> None:

    db.delete(produto)
    db.commit()
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from datetime import date

from app.models.comanda_model import Comanda
from app.models.product_model import Produto
from app.models.item_comanda_model import ItemComanda
from app.models.lote_model import Lote


from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comanda_model import Comanda
from app.models.product_model import Produto
from app.models.lote_model import Lote
from app.models.item_comanda_model import ItemComanda


def adicionar_itens(
    db: Session,
    comanda_id: int,
    itens: list[ItemComandaCreate],
    usuario_id: int
) -> list[ItemComanda]:

    try:
        # Busca e bloqueia a comanda
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError(
                "Não é possível adicionar itens a uma comanda fechada"
            )

        itens_criados = []

        # Percorre todos os itens recebidos
        for dados_item in itens:

            # Verifica se o produto existe
            produto = db.scalar(
                select(Produto)
                .where(Produto.id == dados_item.produto_id)
            )

            if produto is None:
                raise ValueError(
                    f"Produto {dados_item.produto_id} não encontrado"
                )

            # Busca e bloqueia os lotes válidos com estoque
            lotes = db.scalars(
                select(Lote)
                .where(
                    Lote.produto_id == dados_item.produto_id,
                    Lote.quantidade > 0
                )
                .order_by(
                    Lote.data_de_validade.asc(),
                    Lote.id.asc()
                )
                .with_for_update()
            ).all()

            estoque_disponivel = sum(
                lote.quantidade for lote in lotes
            )

            if estoque_disponivel < dados_item.quantidade:
                raise ValueError(
                    f"Estoque insuficiente para o produto "
                    f"{produto.nome}"
                )

            quantidade_restante = dados_item.quantidade

            # Consome os lotes por ordem de vencimento
            for lote in lotes:

                if quantidade_restante == 0:
                    break

                quantidade_utilizada = min(
                    lote.quantidade,
                    quantidade_restante
                )

                lote.quantidade -= quantidade_utilizada
                quantidade_restante -= quantidade_utilizada

                item = ItemComanda(
                    comanda_id=comanda_id,
                    produto_id=produto.id,
                    nome_produto=produto.nome,
                    lote_id=lote.id,
                    usuario_id=usuario_id,
                    quantidade=quantidade_utilizada,
                    preco_unitario=produto.preco,
                    comentario=dados_item.comentario
                )

                db.add(item)
                itens_criados.append(item)

        # Persiste todos os itens de uma única vez
        db.commit()

        for item in itens_criados:
            db.refresh(item)

        return itens_criados

    except Exception:
        db.rollback()
        raise

def listar_itens(
    db: Session,
    comanda_id: int
) -> list[ItemComanda]:

    comando = (
        select(ItemComanda)
        .where(ItemComanda.comanda_id == comanda_id)
        .options(
            selectinload(ItemComanda.produto),
            selectinload(ItemComanda.usuario)
        )
        .order_by(ItemComanda.id)
    )

    return db.scalars(comando).all()


def deletar_item(
    db: Session,
    comanda_id: int,
    item_id: int
) -> None:

    try:
        # Busca e bloqueia a comanda
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError(
                "Não é possível alterar uma comanda fechada"
            )

        # Busca e bloqueia somente o item informado
        item = db.scalar(
            select(ItemComanda)
            .where(
                ItemComanda.id == item_id,
                ItemComanda.comanda_id == comanda_id
            )
            .with_for_update()
        )

        if item is None:
            raise ValueError("Item não encontrado nesta comanda")
        
        if item.lote_id == None:
            return

        # Busca e bloqueia o lote associado ao item
        lote = db.scalar(
            select(Lote)
            .where(Lote.id == item.lote_id)
            .with_for_update()
        )

        if lote is None:
            raise ValueError("Lote associado ao item não encontrado")

        # Devolve a quantidade ao lote original
        lote.quantidade += item.quantidade

        # Remove somente a linha informada
        db.delete(item)

        db.commit()

    except Exception:
        db.rollback()
        raise
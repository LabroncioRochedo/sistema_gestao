from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lote_model import Lote
from app.models.product_model import Produto


def consumir_lotes(db: Session, produto: Produto, quantidade: int) -> list[tuple[Lote, int]]:
    lotes = db.scalars(select(Lote).where(Lote.produto_id == produto.id, Lote.quantidade > 0)
                       .order_by(Lote.data_de_validade, Lote.id).with_for_update()).all()
    if sum(lote.quantidade for lote in lotes) < quantidade:
        raise ValueError(f"Estoque insuficiente para o produto {produto.nome}")

    consumos = []
    for lote in lotes:
        if lote.quantidade == 0:
            continue
        usada = min(quantidade, lote.quantidade)
        lote.quantidade -= usada
        consumos.append((lote, usada))
        quantidade -= usada
        if quantidade == 0:
            break
    return consumos

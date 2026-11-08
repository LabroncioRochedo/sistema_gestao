from app.repositories import venda_repository
from app.schemas.venda_schema import VendaDiretaListaCreate

def vender_comanda(
    db,
    comanda_id: int,
    usuario_id: int,
    forma_pagamento: str
):
    return venda_repository.vender_comanda(
        db=db,
        comanda_id=comanda_id,
        usuario_id=usuario_id,
        forma_pagamento=forma_pagamento
    )

def vender_produtos_direto(
    db: Session,
    dados: VendaDiretaListaCreate,
    usuario_id: int,
):
    return venda_repository.vender_produtos_direto(
        db=db,
        itens=dados.itens,
        usuario_id=usuario_id,
        forma_pagamento=dados.forma_pagamento,
    )

def listar_vendas(db):
    return venda_repository.listar_vendas(db)


def listar_itens_venda(db, venda_id: int):
    venda = venda_repository.buscar_venda_por_id(
        db, venda_id
    )

    if venda is None:
        raise ValueError("Venda não encontrada")

    return venda_repository.listar_itens_venda(
        db, venda_id
    )
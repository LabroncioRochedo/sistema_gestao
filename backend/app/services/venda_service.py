from app.repositories import venda_repository


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

def vender_produto_direto(
    db,
    produto_id: int,
    quantidade: int,
    usuario_id: int,
    forma_pagamento: str,
):
    return venda_repository.vender_produto_direto(
        db=db,
        produto_id=produto_id,
        quantidade=quantidade,
        usuario_id=usuario_id,
        forma_pagamento=forma_pagamento,
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
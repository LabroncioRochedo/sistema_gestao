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
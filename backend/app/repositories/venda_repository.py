from datetime import datetime, timezone, date
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.user_model import Usuario
from app.models.comanda_model import Comanda
from app.models.item_comanda_model import ItemComanda
from app.models.product_model import Produto
from app.models.venda_model import Venda
from app.models.item_venda_model import ItemVenda
from app.models.lote_model import Lote
from app.models.pagamento_comanda import PagamentoComanda



def vender_comanda(
    db: Session,
    comanda_id: int,
    usuario_id: int,
    forma_pagamento: str
):
    try:
        # Busca e bloqueia a comanda
        comanda = db.execute(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        ).scalar_one_or_none()

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError("Comanda não está aberta")

        # Busca e bloqueia os itens
        itens = db.execute(
            select(ItemComanda)
            .where(ItemComanda.comanda_id == comanda_id)
            .order_by(ItemComanda.id)
            .with_for_update()
        ).scalars().all()

        if not itens:
            raise ValueError("Não é possível vender uma comanda vazia")

        # Calcula o valor total da comanda
        valor_total = sum(
            (
                Decimal(str(item.preco_unitario)) * item.quantidade
                for item in itens
            ),
            Decimal("0.00")
        )

        # Busca e bloqueia os pagamentos anteriores
        pagamentos = db.execute(
            select(PagamentoComanda)
            .where(PagamentoComanda.comanda_id == comanda_id)
            .with_for_update()
        ).scalars().all()

        valor_pago = sum(
            (
                Decimal(str(pagamento.valor))
                for pagamento in pagamentos
            ),
            Decimal("0.00")
        )

        # Calcula o saldo restante
        saldo_restante = valor_total - valor_pago

        if saldo_restante < 0:
            raise ValueError(
                "O total pago é superior ao valor da comanda. "
                "Verifique os pagamentos antes de fechar."
            )

        # Busca o usuário responsável pela venda
        usuario = db.get(Usuario, usuario_id)

        if usuario is None:
            raise ValueError("Usuário não encontrado")

        # Cria a venda
        venda = Venda(
            nome_usuario=usuario.nome,
            nome_venda=comanda.nome,
            valor_total=valor_total,
            data_venda=datetime.now(timezone.utc)
        )

        db.add(venda)
        db.flush()

        # Registra os itens da venda
        for item in itens:
            item_venda = ItemVenda(
                venda_id=venda.id,
                produto_id=item.produto_id,
                nome_usuario=usuario.nome,
                nome_produto=item.nome_produto,
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario
            )

            db.add(item_venda)

        # Registra o pagamento restante, se houver
        if saldo_restante > Decimal("0.00"):
            pagamento_final = PagamentoComanda(
                comanda_id=None,
                venda_id=venda.id,
                nome_usuario=usuario.nome,
                valor=saldo_restante,
                forma_pagamento=forma_pagamento
            )

            db.add(pagamento_final)

        # Vincula os pagamentos parciais à venda
        # e desvincula-os da comanda que será excluída
        for pagamento in pagamentos:
            pagamento.venda_id = venda.id
            pagamento.comanda_id = None

        # Garante que os pagamentos e itens da venda
        # sejam persistidos antes da exclusão da comanda
        db.flush()

        # Exclui os itens temporários
        for item in itens:
            db.delete(item)

        # Exclui a comanda
        db.delete(comanda)

        db.commit()
        db.refresh(venda)

        return venda

    except Exception:
        db.rollback()
        raise


def vender_produtos_direto(
    db: Session,
    itens: list[VendaDiretaCreate],
    usuario_id: int,
    forma_pagamento: str,
):
    try:
        valor_total = Decimal("0.00")

        usuario = db.scalar(
            select(Usuario)
            .where(Usuario.id == usuario_id)
        )

        # Cria uma única venda
        venda = Venda(
            nome_usuario=usuario.nome,
            nome_venda="caixa",
            valor_total=valor_total,
            data_venda=datetime.now(timezone.utc),
        )

        db.add(venda)
        db.flush()

        # Percorre os produtos recebidos
        for dados_item in itens:

            produto = db.scalar(
                select(Produto)
                .where(Produto.id == dados_item.produto_id)
            )

            if produto is None:
                raise ValueError(
                    f"Produto {dados_item.produto_id} não encontrado"
                )

            # Busca e bloqueia os lotes válidos
            lotes = db.scalars(
                select(Lote)
                .where(
                    Lote.produto_id == produto.id,
                    Lote.quantidade > 0,
                    Lote.data_de_validade >= date.today()
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
                    f"Estoque insuficiente para o produto {produto.nome}"
                )

            preco_unitario = Decimal(str(produto.preco))

            quantidade_restante = dados_item.quantidade

            # Consome o estoque dos lotes
            for lote in lotes:

                if quantidade_restante == 0:
                    break

                quantidade_utilizada = min(
                    lote.quantidade,
                    quantidade_restante
                )

                lote.quantidade -= quantidade_utilizada
                quantidade_restante -= quantidade_utilizada

            # Cria somente um registro para o produto
            item = ItemVenda(
                venda_id=venda.id,
                produto_id=produto.id,
                nome_usuario=usuario.nome,
                nome_produto=produto.nome,
                quantidade=dados_item.quantidade,
                preco_unitario=preco_unitario,
            )

            db.add(item)

            # Calcula o valor total
            valor_total += (
                preco_unitario * dados_item.quantidade
            )

        venda.valor_total = valor_total

        pagamento_final = PagamentoComanda(
                comanda_id=None,
                venda_id=venda.id,
                nome_usuario=usuario.nome,
                valor=valor_total,
                forma_pagamento=forma_pagamento
            )

        db.add(pagamento_final)

        db.commit()
        db.refresh(venda)

        return venda

    except Exception:
        db.rollback()
        raise

def listar_vendas(db):
    stmt = (
        select(Venda)
        .order_by(Venda.data_venda.desc())
    )

    return db.scalars(stmt).all()


def buscar_venda_por_id(db, venda_id: int):
    stmt = select(Venda).where(
        Venda.id == venda_id
    )

    return db.scalar(stmt)


def listar_itens_venda(db, venda_id: int):
    stmt = (
        select(ItemVenda)
        .where(ItemVenda.venda_id == venda_id)
        .order_by(ItemVenda.id)
    )

    return db.scalars(stmt).all()

def listar_pagamentos_comanda_vendida(
    db: Session,
    venda_id: int
):
    return db.scalars(
        select(PagamentoComanda)
        .where(PagamentoComanda.venda_id == venda_id)
        .order_by(PagamentoComanda.data_pagamento.desc())
    ).all()

def registrar_pagamento_comanda(
    db: Session,
    comanda_id: int,
    usuario_id: int,
    valor: Decimal,
    forma_pagamento: str
):
    try:
        # Bloqueia a comanda para evitar pagamentos simultâneos
        comanda = db.scalar(
            select(Comanda)
            .where(Comanda.id == comanda_id)
            .with_for_update()
        )

        if comanda is None:
            raise ValueError("Comanda não encontrada")

        if comanda.status != "aberta":
            raise ValueError("A comanda não está aberta")

        valor = Decimal(str(valor))

        if valor <= Decimal("0.00"):
            raise ValueError("O valor do pagamento deve ser maior que zero")

        # Calcula o valor total dos itens da comanda
        itens = db.scalars(
            select(ItemComanda)
            .where(ItemComanda.comanda_id == comanda_id)
        ).all()

        valor_total = sum(
            (
                Decimal(str(item.preco_unitario)) * item.quantidade
                for item in itens
            ),
            Decimal("0.00")
        )

        # Calcula quanto já foi recebido
        valor_pago = db.scalar(
            select(func.coalesce(func.sum(PagamentoComanda.valor), 0))
            .where(PagamentoComanda.comanda_id == comanda_id)
        )

        valor_pago = Decimal(str(valor_pago))

        saldo = valor_total - valor_pago

        if valor > saldo:
            raise ValueError(
                f"Pagamento superior ao saldo restante de R$ {saldo:.2f}"
            )

        # Confirma que o usuário existe
        usuario = db.scalar(
            select(Usuario)
            .where(Usuario.id == usuario_id)
        )

        if usuario is None:
            raise ValueError("Usuário não encontrado")

        pagamento = PagamentoComanda(
            comanda_id=comanda_id,
            nome_usuario=usuario.nome,
            valor=valor,
            forma_pagamento=forma_pagamento
        )

        db.add(pagamento)
        db.commit()
        db.refresh(pagamento)

        return pagamento

    except Exception:
        db.rollback()
        raise
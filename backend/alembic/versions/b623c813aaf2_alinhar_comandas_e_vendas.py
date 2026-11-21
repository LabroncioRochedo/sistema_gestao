"""Alinha vendas, pagamentos e histórico com os modelos da API."""

from alembic import op
import sqlalchemy as sa

revision = "b623c813aaf2"
down_revision = "68041218e321"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "historico_itens_comanda",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("comanda_id", sa.Integer, sa.ForeignKey("comandas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", sa.Integer, sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("nome_produto", sa.String(250), nullable=False),
        sa.Column("quantidade", sa.Integer, nullable=False),
        sa.Column("preco_unitario", sa.Numeric(10, 2), nullable=False),
        sa.Column("operacao", sa.String(20), nullable=False),
        sa.Column("comentario", sa.String(250)),
        sa.Column("data_movimentacao", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "pagamentos_comanda",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("comanda_id", sa.Integer, sa.ForeignKey("comandas.id")),
        sa.Column("venda_id", sa.Integer, sa.ForeignKey("vendas.id")),
        sa.Column("nome_usuario", sa.String(100), nullable=False),
        sa.Column("valor", sa.Numeric(10, 2), nullable=False),
        sa.Column("forma_pagamento", sa.String(30), nullable=False),
        sa.Column("data_pagamento", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for coluna in ("id", "comanda_id", "venda_id"):
        op.create_index(f"ix_pagamentos_comanda_{coluna}", "pagamentos_comanda", [coluna])

    for tabela in ("itens_comanda", "itens_venda"):
        op.add_column(tabela, sa.Column("nome_produto", sa.String(250)))
        op.execute(f"""
            UPDATE {tabela} AS i SET nome_produto = p.nome
            FROM produtos AS p WHERE i.produto_id = p.id
        """)
        op.alter_column(tabela, "nome_produto", nullable=False)
        op.alter_column(tabela, "produto_id", nullable=True)

    op.alter_column("itens_comanda", "lote_id", nullable=True)
    op.add_column("itens_comanda", sa.Column("data", sa.DateTime(timezone=True)))
    op.execute("""
        UPDATE itens_comanda AS i SET data = c.data_abertura AT TIME ZONE 'UTC'
        FROM comandas AS c WHERE i.comanda_id = c.id
    """)
    op.alter_column("itens_comanda", "data", nullable=False)

    for tabela, tamanho in (("vendas", 100), ("itens_venda", 250)):
        op.add_column(tabela, sa.Column("nome_usuario", sa.String(tamanho)))
        op.execute(f"""
            UPDATE {tabela} AS v SET nome_usuario = u.nome
            FROM usuarios AS u WHERE v.usuario_id = u.id
        """)
        op.alter_column(tabela, "nome_usuario", nullable=False)
        op.drop_column(tabela, "usuario_id")

    # Bancos que já executaram a antiga 1a11 perderam a referência à comanda.
    op.add_column("vendas", sa.Column("nome_venda", sa.String(100)), if_not_exists=True)
    op.execute("UPDATE vendas SET nome_venda = 'Venda ' || id WHERE nome_venda IS NULL")
    op.alter_column("vendas", "nome_venda", nullable=False)
    op.execute("""
        INSERT INTO pagamentos_comanda
            (venda_id, nome_usuario, valor, forma_pagamento, data_pagamento)
        SELECT id, nome_usuario, valor_total, forma_pagamento, data_venda AT TIME ZONE 'UTC'
        FROM vendas
    """)
    op.drop_column("vendas", "forma_pagamento")


def downgrade() -> None:
    raise RuntimeError(
        "O esquema anterior não representa pagamentos parciais nem itens avulsos. "
        "Para reverter, restaure o backup anterior à migração."
    )

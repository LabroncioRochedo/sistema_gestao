"""Preserva as anotações independentemente do ciclo de vida da comanda."""

from alembic import op
import sqlalchemy as sa

revision = "d6399bfae712"
down_revision = "eb42f871da03"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("historico_comandas",
        sa.Column("comanda_id", sa.Integer(), primary_key=True, autoincrement=False),
        sa.Column("nome", sa.String(90), nullable=False),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("data_encerramento", sa.DateTime(timezone=True)),
    )
    op.execute("""
        INSERT INTO historico_comandas (comanda_id, nome, numero, status)
        SELECT id, nome, numero, status FROM comandas
    """)
    tabela = "historico_itens_comanda"
    op.add_column(tabela, sa.Column("nome_usuario", sa.String(100)))
    op.execute("""
        UPDATE historico_itens_comanda AS h SET nome_usuario = u.nome
        FROM usuarios AS u WHERE u.id = h.usuario_id
    """)
    op.alter_column(tabela, "nome_usuario", nullable=False)
    # Há bancos instalados com nomes diferentes para as chaves estrangeiras.
    op.execute("""
        DO $$ DECLARE chave record;
        BEGIN
          FOR chave IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'historico_itens_comanda'::regclass AND contype = 'f'
              AND confrelid IN ('comandas'::regclass, 'usuarios'::regclass)
          LOOP
            EXECUTE format('ALTER TABLE historico_itens_comanda DROP CONSTRAINT %I', chave.conname);
          END LOOP;
        END $$
    """)
    op.alter_column(tabela, "usuario_id", nullable=True)
    op.create_foreign_key("fk_historico_item_usuario", tabela, "usuarios",
                          ["usuario_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_historico_item_comanda", tabela, "historico_comandas",
                          ["comanda_id"], ["comanda_id"])
    op.create_index("ix_historico_itens_comanda_comanda_id", tabela, ["comanda_id"])


def downgrade():
    raise RuntimeError("O esquema anterior não preserva históricos encerrados. Restaure o backup para reverter.")

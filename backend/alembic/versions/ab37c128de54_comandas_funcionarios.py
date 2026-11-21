"""Cria uma comanda própria por funcionário."""
from alembic import op
import sqlalchemy as sa

revision = "ab37c128de54"
down_revision = "d6399bfae712"
branch_labels = depends_on = None


def upgrade():
    op.create_table("comandas_funcionarios",
        sa.Column("funcionario_id", sa.Integer, sa.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True, autoincrement=False))
    op.create_table("itens_comanda_funcionario",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("funcionario_id", sa.Integer, sa.ForeignKey("comandas_funcionarios.funcionario_id", name="fk_item_conta_funcionario"), nullable=False),
        sa.Column("lote_id", sa.Integer, sa.ForeignKey("lotes.id", name="fk_item_conta_lote")),
        sa.Column("nome", sa.String(250), nullable=False),
        sa.Column("quantidade", sa.Integer, nullable=False),
        sa.Column("preco_unitario", sa.Numeric(10, 2), nullable=False),
        sa.Column("anotado_por", sa.String(100), nullable=False),
        sa.Column("data", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_itens_comanda_funcionario_funcionario_id", "itens_comanda_funcionario", ["funcionario_id"])
    op.execute("INSERT INTO comandas_funcionarios SELECT id FROM usuarios WHERE cargo = 'funcionario'")


def downgrade():
    op.drop_table("itens_comanda_funcionario")
    op.drop_table("comandas_funcionarios")

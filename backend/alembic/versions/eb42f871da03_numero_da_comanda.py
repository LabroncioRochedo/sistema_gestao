"""Adiciona um número de atendimento de 1 a 999 a cada comanda."""

from alembic import op
import sqlalchemy as sa

revision = "eb42f871da03"
down_revision = "b623c813aaf2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("comandas", sa.Column("numero", sa.Integer()))
    op.execute("""
        DO $$ BEGIN
            IF (SELECT count(*) FROM comandas) > 999 THEN
                RAISE EXCEPTION 'Há mais de 999 comandas. Libere números antes de migrar.';
            END IF;
        END $$
    """)
    # Preserva o número que a tela exibia quando o ID cabe na nova faixa.
    op.execute("UPDATE comandas SET numero = id WHERE id BETWEEN 1 AND 999")
    op.execute("""
        WITH livres AS (
            SELECT n, row_number() OVER (ORDER BY n) AS ordem
            FROM generate_series(1, 999) AS n
            WHERE NOT EXISTS (SELECT 1 FROM comandas WHERE numero = n)
        ), pendentes AS (
            SELECT id, row_number() OVER (ORDER BY id) AS ordem
            FROM comandas WHERE numero IS NULL
        )
        UPDATE comandas SET numero = livres.n
        FROM pendentes JOIN livres USING (ordem)
        WHERE comandas.id = pendentes.id
    """)
    op.alter_column("comandas", "numero", nullable=False)
    op.create_check_constraint("ck_comandas_numero", "comandas", "numero BETWEEN 1 AND 999")
    op.create_unique_constraint("uq_comandas_numero", "comandas", ["numero"])


def downgrade() -> None:
    op.drop_column("comandas", "numero")

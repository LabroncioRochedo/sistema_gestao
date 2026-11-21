"""adiciona lotes e lote_id em itens_comanda

Revision ID: c824a90ae0d6
Revises: 0ed0ee14f905
Create Date: 2026-10-21 00:32:49.268382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c824a90ae0d6'
down_revision: Union[str, Sequence[str], None] = '0ed0ee14f905'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('itens_comanda', sa.Column('lote_id', sa.Integer(), nullable=True))
    # Se já houver vários lotes na revisão intermediária, a origem é ambígua.
    op.execute("""
        UPDATE itens_comanda i SET lote_id = origem.id
        FROM (
            SELECT produto_id, min(id) AS id FROM lotes
            GROUP BY produto_id HAVING count(*) = 1
        ) origem WHERE i.produto_id = origem.produto_id
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM itens_comanda WHERE lote_id IS NULL) THEN
                RAISE EXCEPTION 'Há itens sem lote de origem único. Reconcilie os itens e lotes antes de migrar.';
            END IF;
        END $$
    """)
    op.create_foreign_key('itens_comanda_lote_id_fkey', 'itens_comanda', 'lotes', ['lote_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('itens_comanda_lote_id_fkey', 'itens_comanda', type_='foreignkey')
    op.drop_column('itens_comanda', 'lote_id')

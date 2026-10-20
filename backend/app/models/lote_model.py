from datetime import date

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Lote(Base):
    __tablename__ = "lotes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id"),
        nullable=False,
        index=True,
    )

    quantidade: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    data_de_validade: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    # Relacionamento com o produto que este lote representa.
    produto: Mapped["Produto"] = relationship(
        back_populates="lotes",
    )
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    preco: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Um produto pode ter vários lotes.
    lotes: Mapped[list["Lote"]] = relationship(
        back_populates="produto",
        cascade="all, delete-orphan",
    )
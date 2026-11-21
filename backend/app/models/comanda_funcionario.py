from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ComandaFuncionario(Base):
    __tablename__ = "comandas_funcionarios"

    funcionario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    itens: Mapped[list["ItemComandaFuncionario"]] = relationship(order_by="ItemComandaFuncionario.id")


class ItemComandaFuncionario(Base):
    __tablename__ = "itens_comanda_funcionario"

    id: Mapped[int] = mapped_column(primary_key=True)
    funcionario_id: Mapped[int] = mapped_column(ForeignKey("comandas_funcionarios.funcionario_id", name="fk_item_conta_funcionario"), index=True)
    lote_id: Mapped[int | None] = mapped_column(ForeignKey("lotes.id", name="fk_item_conta_lote"))
    nome: Mapped[str] = mapped_column(String(250))
    quantidade: Mapped[int]
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    anotado_por: Mapped[str] = mapped_column(String(100))
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

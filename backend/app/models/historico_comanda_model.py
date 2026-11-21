from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class HistoricoComanda(Base):
    __tablename__ = "historico_comandas"

    comanda_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    numero: Mapped[int]
    nome: Mapped[str] = mapped_column(String(90))
    status: Mapped[str] = mapped_column(String(30))
    data_encerramento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    anotacoes: Mapped[list["HistoricoItemComanda"]] = relationship(
        order_by="(HistoricoItemComanda.data_movimentacao, HistoricoItemComanda.id)",
    )

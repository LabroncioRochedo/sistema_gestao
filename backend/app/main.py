from fastapi import FastAPI

import app.models
from app.routers.auth import router as auth_router
from app.routers.user import router as user_router
from app.routers.product import router as product_router
from app.routers.comanda import router as comanda_router
from app.routers.item_comanda import router as item_comanda_router
from app.routers.venda import router as venda_router


app = FastAPI(
    title="Sistema de Gestão API",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(product_router)
app.include_router(comanda_router)
app.include_router(item_comanda_router)
app.include_router(venda_router)
from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.user import router as user_router
from app.routers.product import router as product_router


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
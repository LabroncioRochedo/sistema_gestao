from fastapi import FastAPI

from app.routers.user import router as user_router


app = FastAPI(
    title="Sistema de Gestão API",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(user_router)
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

def test_login():

    response = client.post(
        "/auth/login",
        json={
            "nome": "marcelo",
            "senha": "12345678"
        }
        )

    assert response.status_code == 200
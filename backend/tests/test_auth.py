from fastapi.testclient import TestClient


def test_login(client: TestClient, credenciais_teste):
    response = client.post("/auth/login", json=credenciais_teste)
    assert response.status_code == 200

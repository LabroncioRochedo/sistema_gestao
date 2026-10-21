from fastapi.testclient import TestClient

def test_login(client: TestClient):

    response = client.post(
        "/auth/login",
        json={
            "nome": "Marcus",
            "senha": "12345678"
        }
        )

    assert response.status_code == 200
from fastapi.testclient import TestClient

def test_listar_funcionarios(client: TestClient,auth_headers: dict[str, str]):

    response = client.get("/usuarios/funcionarios",
        headers=auth_headers)

    assert response.status_code == 200

    print(response.json())
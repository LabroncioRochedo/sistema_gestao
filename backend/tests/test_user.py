from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


# def test_criar_usuario():
#
#   response = client.post(
#       "/usuarios/",
#      json={
#            "nome": "marceloss",
#            "senha": "12345678"
#        }
#    )
#
#    assert response.status_code == 201
#
#    data = response.json()
#
#    assert data["nome"] == "marceloss"
#    assert data["cargo"] == "funcionario"
#
#    assert "senha" not in data

def test_listar_funcionarios():

    response = client.get("/usuarios/funcionarios")

    assert response.status_code == 200

    print(response.json())
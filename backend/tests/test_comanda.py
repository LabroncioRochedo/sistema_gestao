def test_abrir_comanda(client, auth_headers):
    response = client.post(
        "/comandas",
        json={
            "nome":"jose_12"
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["status"] == "aberta"
    assert data["usuario_id"] is not None

def test_abrir_comanda_sem_token(client):
    response = client.post(
        "/comandas",
        json={
            "nome":"jose_11"
        }
    )

    assert response.status_code == 401
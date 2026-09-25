from fastapi.testclient import TestClient

def test_upload_imagem_produto(client: TestClient,auth_headers: dict[str, str]):

    response = client.post(
        "/produtos",
        json={
            "nome": "Produto com imagem",
            "preco": 10.50,
            "quantidade": 10,
            "data_de_validade": "2027-10-15"
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    produto_id = response.json()["id"]

    imagem = (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01"
        b"\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00"
        b"\x90wS\xde"
        b"\x00\x00\x00\x0c"
        b"IDAT"
        b"\x08\xd7c\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00"
        b"\x18\xdd\x8d\xb1"
        b"\x00\x00\x00\x00"
        b"IEND\xaeB`\x82"
    )

    response = client.post(
        f"/produtos/{produto_id}/imagem",
        files={
            "imagem": (
                "produto.png",
                imagem,
                "image/png"
            )
        },
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == produto_id
    assert data["imagem_url"] == (
        f"/produtos/{produto_id}/imagem"
    )
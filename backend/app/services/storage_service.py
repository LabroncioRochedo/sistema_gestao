from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 40 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


def get_storage_root() -> Path:
    return Path(settings.media_root).resolve()


def get_file_path(image_key: str) -> Path:
    root = get_storage_root()

    file_path = (root / image_key).resolve()

    if root not in file_path.parents:
        raise ValueError("Caminho de imagem inválido")

    return file_path


async def save_product_image(
    imagem: UploadFile
) -> str:

    if imagem.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            "Formato de imagem não permitido. "
            "Use JPG, PNG ou WEBP."
        )

    extension = ALLOWED_CONTENT_TYPES[
        imagem.content_type
    ]

    filename = f"{uuid4()}{extension}"

    image_key = f"produtos/{filename}"

    file_path = get_file_path(image_key)

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    total_size = 0

    try:
        with open(file_path, "wb") as file:

            while True:
                chunk = await imagem.read(CHUNK_SIZE)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise ValueError(
                        "A imagem deve ter no máximo 40 MB."
                    )

                file.write(chunk)

    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise

    return image_key


def delete_image(image_key: str) -> None:

    file_path = get_file_path(image_key)

    if file_path.exists():
        file_path.unlink()
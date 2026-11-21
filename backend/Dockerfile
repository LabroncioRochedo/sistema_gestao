
FROM python:3.14-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Evita arquivos .pyc e mantém os logs visíveis
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instala as dependências primeiro para aproveitar o cache
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do backend
COPY . .

# Documenta a porta utilizada pela API
EXPOSE 8000

# Só inicia a API após aplicar as migrações pendentes.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]

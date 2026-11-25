# Sistema de gestão de conveniência

Aplicativo para controlar o estoque por lote, atender clientes por comanda e registrar vendas de balcão. A equipe usa o aplicativo móvel em React Native e Expo. Uma API FastAPI grava produtos, movimentações e pagamentos no PostgreSQL.

## O que o sistema faz

| Área | Operações |
| --- | --- |
| Produtos e estoque | Consultar preços e quantidades, cadastrar produtos com o primeiro lote, repor por quantidade e validade. |
| Comandas de clientes | Abrir uma comanda com nome e número de 1 a 999, lançar produtos ou itens avulsos, receber pagamentos parciais e fechar a venda. A exclusão de uma comanda aberta devolve os produtos ao estoque. |
| Vendas e histórico | Vender diretamente no balcão, consultar itens e pagamentos de uma venda e acompanhar as movimentações de comandas encerradas. |
| Contas de funcionários | Cada funcionário pode consultar a própria conta e anotar consumo. O administrador pode lançar itens em qualquer conta, remover anotações e quitar o saldo. A baixa de estoque ocorre ao anotar o produto. |

Os dois perfis operam as comandas de clientes e as vendas. O perfil `admin` também mantém o catálogo, cadastra lotes e gerencia funcionários. No aplicativo, o administrador acessa **Funcionários** e quem tem o perfil `funcionario` acessa **Minha comanda**.

## Executar localmente

Para a API e o banco, use Docker com o plugin Compose e a porta 80 livre. Para o aplicativo, use Node.js e npm (por exemplo, Node 24 a partir da versão 24.3). Execute os comandos a partir da raiz do repositório, salvo indicação em contrário.

### 1. Configurar o banco e a API

O projeto usa dois arquivos de ambiente no backend. O Compose lê o `.env` da **raiz** para configurar o PostgreSQL e passar a URL de conexão à API. Para uma instalação nova, use o seguinte modelo nesse arquivo e substitua a senha por um valor local. Uma senha hexadecimal, gerada com `openssl rand -hex 32`, também pode ser usada na URL sem precisar de codificação.

```dotenv
POSTGRES_DB=gestao
POSTGRES_USER=gestao
POSTGRES_PASSWORD=substitua_por_uma_senha
DATABASE_URL=postgresql+psycopg://gestao:substitua_por_uma_senha@db:5432/gestao
```

O segundo arquivo, `backend/.env`, configura a aplicação. Use [backend/.env.example](backend/.env.example) como modelo. Em `DATABASE_URL`, repita a URL da raiz. Gere um segredo próprio para `JWT_SECRET_KEY` com outra execução de `openssl rand -hex 32` e preencha os demais campos.

```dotenv
DATABASE_URL=postgresql+psycopg://gestao:substitua_por_uma_senha@db:5432/gestao
JWT_SECRET_KEY=substitua_por_um_segredo_gerado
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

Dentro do Compose, `db` é o nome do serviço PostgreSQL e a URL definida na raiz tem precedência. Os arquivos `.env` locais são ignorados pelo Git.

### 2. Iniciar os serviços

```bash
docker compose up -d --build
docker compose ps
curl http://localhost/health
```

A API aguarda o banco ficar disponível, executa `alembic upgrade head` e inicia o Uvicorn. Quando estiver pronta, a consulta retorna `{"status":"ok"}`. O Nginx recebe as requisições na porta 80 e as encaminha à porta interna 8000 da API. Se a primeira consulta falhar durante a inicialização, acompanhe a migração com `docker compose logs -f api`.

O volume `postgres_data` guarda o banco e `api_storage` guarda as imagens enviadas. Para parar os serviços e manter esses dados, use `docker compose down`.

### 3. Criar o primeiro administrador

Em um banco novo, as migrações criam as tabelas. O cadastro via API já exige um administrador autenticado e cria usuários com o cargo `funcionario`. Para o primeiro acesso, execute uma vez o comando abaixo. Ele pede o nome e a senha no terminal, valida ambos pelas regras de login e grava o hash da senha pelo mesmo mecanismo da aplicação.

```bash
docker compose exec api python -c '
from getpass import getpass
from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.models.user_model import Usuario
from app.repositories.user_repository import create
from app.schemas.auth_schema import LoginRequest

login = LoginRequest(nome=input("Nome do administrador: "), senha=getpass("Senha: "))
with SessionLocal() as db:
    create(db, Usuario(nome=login.nome, senha=hash_password(login.senha), cargo="admin"))
'
```

Escolha um nome de 3 a 100 caracteres e uma senha de 6 a 128 caracteres. Para conferir o acesso antes de abrir o aplicativo, use `POST /auth/login` com os campos `nome` e `senha`. Copie o `access_token` retornado e cole em **Authorize** para experimentar as rotas protegidas. [Abrir Swagger UI local](http://localhost/docs)

### 4. Iniciar o aplicativo

Crie ou ajuste `frontend/.env` com o endereço da API **visto pelo dispositivo**. Para um celular físico, conecte-o à mesma rede do computador e substitua o IP de exemplo pelo IP local da máquina que executa o Docker.

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100
```

No emulador padrão do Android Studio, use `http://10.0.2.2`. No simulador iOS no mesmo Mac da API, use `http://localhost`. Em um celular físico, abrir `/health` no navegador do aparelho permite conferir o endereço antes do login.

```bash
cd frontend
npm ci
npm start
```

Abra o projeto no dispositivo ou simulador pelo servidor do Expo e entre com a conta criada. O comando `npm run web` também inicia o frontend para navegador, mas a sessão atual depende de `expo-secure-store`, sem implementação web no projeto. Use Android ou iOS para o fluxo autenticado.

## Organização do repositório

| Caminho | Conteúdo |
| --- | --- |
| [backend/app](backend/app) | Rotas FastAPI, validação com Pydantic, serviços, repositórios SQLAlchemy e modelos do banco. |
| [backend/alembic/versions](backend/alembic/versions) | Histórico de migrações do PostgreSQL. |
| [backend/tests](backend/tests) | Testes de integração com pytest e o cliente de testes do FastAPI. |
| [frontend/src/app](frontend/src/app) | Telas e navegação por arquivos com Expo Router, incluindo login, comandas, lotes e vendas. |
| [frontend/src/services](frontend/src/services) | Cliente HTTP Axios e funções de sessão e perfil. |
| [compose.yaml](compose.yaml) e [nginx/default.conf](nginx/default.conf) | Serviços, volumes, rede interna e proxy da API. O frontend é iniciado separadamente. |

## Verificações de desenvolvimento

No frontend, execute em `frontend/` após instalar as dependências.

```bash
npm run lint
npx tsc --noEmit
```

Para testar a API, use **um PostgreSQL exclusivo para testes**. A suíte cria e exclui registros no banco apontado por `DATABASE_URL` e usa uma conta administrativa existente. A imagem Docker da API exclui a pasta de testes na construção. Para executar a suíte pelo código-fonte, use Python 3.14, como no Dockerfile. No exemplo abaixo, ajuste a URL para apontar a um banco de testes já criado e acessível a partir do terminal.

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DATABASE_URL='postgresql+psycopg://usuario:senha@localhost:5432/gestao_teste'
python -m alembic upgrade head
```

O Compose do projeto mantém o PostgreSQL na rede interna. Para criar o administrador no banco de testes, use o trecho do primeiro acesso trocando `docker compose exec api python -c` por `python -c`, no mesmo terminal. Depois, informe as credenciais da conta de testes e execute a suíte.

```bash
export TEST_LOGIN_NOME='nome_do_admin_de_teste'
read -rs -p 'Senha do administrador de teste: ' TEST_LOGIN_SENHA
export TEST_LOGIN_SENHA
python -m pytest -q
```

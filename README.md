# mangertask MVP

## Arquitetura atual

- **Backend**: Node.js + Express modular (`backend/src/modules/*`).
- **Banco local**: **DynamoDB Local** via Docker Compose.
- **Frontend**: Expo/React Native consumindo API REST.

## Subir localmente com Docker Compose

### Pré-requisitos

- Docker Desktop (Windows/Mac) ou Docker Engine + Compose (Linux).

### Arquivos `.env`

Este repositório já inclui:

- `backend/.env` (variáveis do backend)
- `.env` na raiz (variáveis usadas pelo `docker-compose.yml`)
- as variávis de ambiente deven ser registradas no windows: AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
- `DDB_RUN_BOOTSTRAP_SEED=false` (padrão) evita limpar/repopular as tabelas a cada inicialização; use `true` apenas quando quiser resetar e recarregar os dados de seed.
Se quiser recriar do zero:

```bash
cp backend/.env.example backend/.env
```

### 1) Subir backend + DynamoDB local

```bash
docker compose up -d --build
```

Serviços:

- Backend API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- DynamoDB Local: `http://localhost:8000`

### 2) Subir frontend via Docker (opcional)

```bash
docker compose --profile frontend up -d --build
```

Para acompanhar o QR/link do Expo:

```bash
docker compose --profile frontend logs -f frontend
```

## Subida sem Docker (opcional)

### Backend

```bash
cd backend
npm install
npm run dev
```

> Se você for conectar em uma conta AWS real (sem `AWS_ENDPOINT_URL_DYNAMODB`), e estiver usando credenciais temporárias (STS/SSO), inclua também `AWS_SESSION_TOKEN` no `backend/.env`.

### Frontend

```bash
npm install
npx expo start --tunnel
```

Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3001"
npm run start
```

macOS/Linux:

```bash
export EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3001"
npm run start
```

## Endpoints principais

- `GET /health`
- `GET /desenvolvedores`
- `GET /sistemas`
- `GET /dashboard/dev-workload`
- `GET /demandas`
- `POST /demandas`
- `PUT /demandas/:id`
- `DELETE /demandas/:id`
- `GET /demandas/:id/observacoes`
- `POST /demandas/:id/observacoes`
- `PUT /observacoes/:id`
- `DELETE /observacoes/:id`

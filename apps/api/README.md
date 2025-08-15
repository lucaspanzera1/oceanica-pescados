# Autenticação JWT

Autenticação usando Node.js, Express, PostgreSQL e JWT.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação por tokens
- **bcrypt** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing

## 📁 Estrutura do Projeto

```
src/
├── controllers/          # Controllers das rotas
│   └── authController.js
├── routes/              # Definição das rotas
│   └── authRoutes.js
├── services/            # Lógica de negócio
│   └── authService.js
├── middlewares/         # Middlewares personalizados
│   └── auth.js
├── database/            # Configuração do banco
│   └── config.js
└── index.js             # Arquivo principal
```

## ⚙️ Configuração

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

Crie o arquivo `.env` com as seguintes variáveis:

```env
# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASS=admin
DB_NAME=oceanica

# Configuração JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_123456789

# Configuração da API
PORT=3000
NODE_ENV=development
```

### 3. Configurar PostgreSQL

Certifique-se de que o PostgreSQL está rodando no Docker: <a href="../../docs/bd/bd.md">Docs BD</a>


### 4. Executar a aplicação

```bash
# Modo desenvolvimento
pnpm run dev

# Modo produção
pnpm start
```

## 📊 Banco de Dados

### Tabela `users`

| Campo      | Tipo         | Descrição                    |
|------------|--------------|------------------------------|
| id         | SERIAL       | ID único do usuário          |
| email      | VARCHAR(255) | Email único do usuário       |
| password   | VARCHAR(255) | Hash da senha (bcrypt)       |
| role       | VARCHAR(50)  | Função (cliente ou admin)    |
| created_at | TIMESTAMP    | Data de criação              |
| updated_at | TIMESTAMP    | Data da última atualização   |

## 🔐 Endpoints da API

### Autenticação

#### `POST /auth/register`
Registra um novo usuário no sistema.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123",
  "role": "cliente"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `POST /auth/login`
Faz login e retorna token JWT.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `GET /auth/profile`
Obtém dados do usuário autenticado (requer token).

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Perfil obtido com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### `POST /auth/verify-token`
Verifica se um token JWT é válido.

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "decoded": {
      "id": 1,
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "iat": 1642248600,
      "exp": 1642335000
    }
  }
}
```

### Rotas Protegidas (Exemplos)

#### `GET /auth/protected`
Rota que requer autenticação JWT (qualquer usuário).

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### `GET /auth/admin`
Rota que requer autenticação JWT + role admin.

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Utilitários

#### `GET /health`
Health check da API.

**Resposta (200):**
```json
{
  "success": true,
  "message": "API funcionando corretamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 🔒 Autenticação JWT

### Como usar o token

1. Faça login através do endpoint `/auth/login`
2. Copie o token retornado
3. Inclua o token no header `Authorization` das próximas requisições:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Estrutura do Token JWT

O token JWT contém as seguintes informações:

```json
{
  "id": 1,
  "email": "usuario@exemplo.com",
  "role": "cliente",
  "iat": 1642248600,
  "exp": 1642335000,
  "iss": "api-auth-jwt"
}
```

- **id**: ID do usuário
- **email**: Email do usuário  
- **role**: Função do usuário (cliente ou admin)
- **iat**: Timestamp de criação do token
- **exp**: Timestamp de expiração (24h)
- **iss**: Emissor do token

## 🛡️ Middlewares de Segurança

### `authenticateToken`
Verifica se o token JWT é válido e adiciona `req.user` com os dados do usuário.

### `requireAdmin`  
Verifica se o usuário autenticado tem role `admin`. Deve ser usado após `authenticateToken`.

### `requireOwnershipOrAdmin`
Permite acesso apenas se o usuário for o dono do recurso ou admin.

## ⚠️ Tratamento de Erros

A API retorna respostas padronizadas para erros:

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Email e senha são obrigatórios"
}
```

### 401 - Unauthorized  
```json
{
  "success": false,
  "message": "Token de acesso requerido"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Acesso negado. Apenas administradores podem acessar este recurso."
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Rota GET /rota-inexistente não encontrada"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Email já cadastrado no sistema"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Erro interno do servidor"
}
```

## 🧪 Testando a API

### Com cURL

**Registrar usuário:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123",
    "role": "cliente"
  }'
```

**Fazer login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123"
  }'
```

**Acessar rota protegida:**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📝 Logs

A API registra automaticamente:

- Todas as requisições HTTP com timestamp
- Erros de autenticação
- Conexões com o banco de dados
- Inicialização da aplicação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
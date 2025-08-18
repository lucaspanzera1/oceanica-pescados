# API d

API usando Node.js, Express, PostgreSQL e JWT.

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

# API de Autenticação JWT

API completa de autenticação usando Node.js, Express, PostgreSQL e JWT com UUIDs.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados com UUID
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
DB_NAME=auth_db

# Configuração JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_123456789

# Configuração da API
PORT=3000
NODE_ENV=development
```

### 3. Configurar PostgreSQL

Certifique-se de que o PostgreSQL está rodando no Docker:

```bash
# Criar banco de dados (se não existir)
docker exec -it seu_container_postgres psql -U admin -c "CREATE DATABASE auth_db;"
```

A API criará automaticamente as tabelas necessárias na inicialização.

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
| id         | UUID         | Identificador único (UUID v4)|
| email      | VARCHAR(255) | Email único do usuário       |
| password   | VARCHAR(255) | Senha hasheada (bcrypt)      |
| role       | VARCHAR(50)  | Função (cliente/admin)       |
| created_at | TIMESTAMP    | Data de criação              |
| updated_at | TIMESTAMP    | Data da última atualização   |

## 🔐 Endpoints da API

### Autenticação

#### POST /auth/register
Registra um novo usuário no sistema.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123",
  "role": "cliente"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### POST /auth/login
Autentica um usuário e retorna o token JWT.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### GET /auth/profile
Retorna o perfil do usuário autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Perfil obtido com sucesso",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@exemplo.com",
      "role": "cliente",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### GET /auth/user/:id
Busca usuário por UUID (apenas próprio usuário ou admin).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Parâmetros:**
- `id`: UUID do usuário (ex: 550e8400-e29b-41d4-a716-446655440000)

### Rotas Protegidas

#### GET /auth/protected
Rota de exemplo que requer autenticação.

#### GET /auth/admin
Rota de exemplo que requer privilégios de administrador.

## 🛡️ Segurança

- **Senhas hasheadas** com bcrypt (salt rounds = 12)
- **UUIDs** para identificação de usuários (não sequenciais)
- **JWT tokens** com expiração de 24 horas
- **Helmet** para headers de segurança
- **CORS** configurado adequadamente
- **Validação de entrada** em todos os endpoints

## 📝 Códigos de Resposta

| Código | Descrição                    |
|--------|------------------------------|
| 200    | Sucesso                      |
| 201    | Criado com sucesso          |
| 400    | Dados inválidos             |
| 401    | Não autenticado             |
| 403    | Sem permissão               |
| 404    | Não encontrado              |
| 409    | Conflito (email duplicado)   |
| 500    | Erro interno do servidor     |

## 🔧 Middleware de Autenticação

O token JWT deve ser enviado no header Authorization:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Payload do JWT
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@exemplo.com",
  "role": "cliente",
  "iat": 1642248600,
  "exp": 1642335000,
  "iss": "api-auth-jwt"
}
```

## 🚀 Deploy

### Variáveis de Ambiente em Produção
```env
NODE_ENV=production
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_USER=seu_usuario
DB_PASS=sua_senha_segura
DB_NAME=auth_db
JWT_SECRET=sua_chave_super_secreta_256_bits
PORT=3000
```

### Health Check
```
GET /health
```

Retorna o status da API e informações do ambiente.

## 📚 Exemplos de Uso

### Registrar usuário admin
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senhaadmin123",
    "role": "admin"
  }'
```

### Fazer login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "senhaadmin123"
  }'
```

### Acessar perfil
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🛠️ Desenvolvimento

### Scripts disponíveis
- `pnpm run dev` - Executa com nodemon
- `pnpm start` - Executa em produção

### Logs
A API registra automaticamente:
- Todas as requisições HTTP
- Conexões com o banco
- Erros e exceções


## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
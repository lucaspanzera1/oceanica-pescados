const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importações locais
const { testConnection, initializeDatabase } = require('./database/config');
const authRoutes = require('./routes/authRoutes');

/**
 * Configuração e inicialização do servidor Express
 */
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configura os middlewares globais
   */
  setupMiddlewares() {
    // Segurança com helmet
    this.app.use(helmet());
    
    // CORS - permite requisições de diferentes origens
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://lucaspanzera.com'] 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true
    }));

    // Parser de JSON
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parser de URL encoded
    this.app.use(express.urlencoded({ extended: true }));

    // Middleware de log personalizado
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configura as rotas da aplicação
   */
  setupRoutes() {
    // Rota de health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'API funcionando corretamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Rotas de autenticação
    this.app.use('/auth', authRoutes);

    // Rota para 404 - não encontrado
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
        availableRoutes: {
          auth: {
            'POST /auth/register': 'Registrar novo usuário',
            'POST /auth/login': 'Fazer login',
            'POST /auth/verify-token': 'Verificar token JWT',
            'GET /auth/profile': 'Obter perfil (requer autenticação)',
            'GET /auth/protected': 'Rota protegida (requer autenticação)',
            'GET /auth/admin': 'Rota admin (requer autenticação + admin)'
          },
          general: {
            'GET /health': 'Health check da API'
          }
        }
      });
    });
  }

  /**
   * Configura o tratamento global de erros
   */
  setupErrorHandling() {
    // Middleware de tratamento de erros
    this.app.use((error, req, res, next) => {
      console.error('Erro não tratado:', error);

      // Erro de JSON malformado
      if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
          success: false,
          message: 'JSON inválido no corpo da requisição'
        });
      }

      // Erro genérico
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    });
  }

  /**
   * Inicializa o servidor
   */
  async start() {
    try {
      // Testa conexão com o banco
      await testConnection();
      
      // Inicializa as tabelas do banco
      await initializeDatabase();
      
      // Inicia o servidor
      this.app.listen(this.port, () => {
        console.log(`Servidor rodando na porta ${this.port}`);
        console.log(`URL local: http://localhost:${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`Rotas de auth: http://localhost:${this.port}/auth/*`);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar o servidor:', error.message);
      process.exit(1);
    }
  }
}

// Tratamento de sinais do processo
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido, encerrando servidor graciosamente...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', promise, 'razão:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Exceção não capturada:', error);
  process.exit(1);
});

// Inicializa o servidor
const server = new Server();
server.start();
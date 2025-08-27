const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Importações locais
const { testConnection, initializeDatabase, closePool } = require('./database/config');
const { logger, httpLogger, logError } = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

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
    // Compressão de resposta
    this.app.use(compression());
    
    // Segurança com helmet
    this.app.use(helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo de requests
      message: {
        success: false,
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    
    this.app.use('/auth', limiter);
    this.app.use('/products', limiter);
    
    // CORS - permite requisições de diferentes origens
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
      
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Parser de JSON
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }));
    
    // Parser de URL encoded
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: '10mb'
    }));

    // Logger HTTP personalizado
    this.app.use(httpLogger);
    
    // Trust proxy em produção (para IP real do cliente)
    if (process.env.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }
  }

  /**
   * Configura as rotas da aplicação
   */
  setupRoutes() {
    // Rota de health check
    this.app.get('/health', (req, res) => {
      const healthData = {
        success: true,
        message: 'API Oceanica Pescados',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      
      // Em produção, remover dados sensíveis
      if (process.env.NODE_ENV === 'production') {
        delete healthData.memory;
      }
      
      res.json(healthData);
    });

    // Rotas de autenticação
    this.app.use('/auth', authRoutes);

    // Rotas de produtos
    this.app.use('/products', productRoutes);

    // Rota para 404 - não encontrado
    this.app.use('*', (req, res) => {
      logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
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
            'GET /auth/admin': 'Rota admin (requer autenticação + admin)',
            'GET /auth/user/:id': 'Buscar usuário por UUID'
          },
          products: {
            'GET /products': 'Listar produtos (público)',
            'GET /products/:id': 'Buscar produto por UUID (público)',
            'POST /products': 'Criar produto (requer admin)',
            'PUT /products/:id': 'Atualizar produto (requer admin)',
            'DELETE /products/:id': 'Remover produto (requer admin)',
            'PATCH /products/:id/stock': 'Atualizar estoque (requer admin)'
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
      // Log do erro
      logError(error, req);

      // Erro de JSON malformado
      if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
          success: false,
          message: 'JSON inválido no corpo da requisição'
        });
      }
      
      // Erro de rate limit
      if (error.type === 'rate-limit') {
        return res.status(429).json({
          success: false,
          message: 'Muitas tentativas. Tente novamente em alguns minutos.'
        });
      }

      // Erro genérico
      const statusCode = error.statusCode || error.status || 500;
      const response = {
        success: false,
        message: statusCode === 500 ? 'Erro interno do servidor' : error.message
      };
      
      // Em desenvolvimento, incluir detalhes do erro
      if (process.env.NODE_ENV === 'development') {
        response.error = error.message;
        response.stack = error.stack;
      }
      
      res.status(statusCode).json(response);
    });
  }

  /**
   * Inicializa o servidor
   */
  async start() {
    try {
      logger.info('🚀 Iniciando servidor...');
      
      // Testa conexão com o banco
      await testConnection();
      
      // Inicializa as tabelas do banco
      await initializeDatabase();
      
      // Inicia o servidor
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        logger.info(`✅ Servidor rodando na porta ${this.port}`, {
          environment: process.env.NODE_ENV,
          port: this.port,
          pid: process.pid
        });
        
        console.log(`🌐 URL local: http://localhost:${this.port}`);
        console.log(`🏥 Health check: http://localhost:${this.port}/health`);
        console.log(`🔐 Rotas de auth: http://localhost:${this.port}/auth/*`);
        console.log(`📦 Rotas de produtos: http://localhost:${this.port}/products/*`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('\n📚 Documentação das rotas:');
          console.log('  AUTH:');
          console.log('    POST /auth/register - Registrar usuário');
          console.log('    POST /auth/login - Fazer login');
          console.log('    GET /auth/profile - Obter perfil (requer token)');
          console.log('    GET /auth/protected - Rota protegida (requer token)');
          console.log('    GET /auth/admin - Rota admin (requer token + admin)');
          console.log('    GET /auth/user/:id - Buscar usuário por UUID');
          console.log('  PRODUTOS:');
          console.log('    GET /products - Listar produtos (público)');
          console.log('    GET /products/:id - Buscar produto (público)');
          console.log('    POST /products - Criar produto (requer admin)');
          console.log('    PUT /products/:id - Atualizar produto (requer admin)');
          console.log('    DELETE /products/:id - Remover produto (requer admin)');
          console.log('    PATCH /products/:id/stock - Atualizar estoque (requer admin)');
        }
      });

      // Configurar graceful shutdown
      this.setupGracefulShutdown(server);

    } catch (error) {
      logger.error('❌ Erro ao iniciar o servidor', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }
  
  /**
   * Configura o encerramento gracioso do servidor
   */
  setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
      logger.info(`🔶 ${signal} recebido, encerrando servidor graciosamente...`);
      
      server.close(async () => {
        logger.info('🔒 Servidor HTTP fechado');
        
        try {
          await closePool();
          logger.info('✅ Shutdown gracioso concluído');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erro durante shutdown', { error: error.message });
          process.exit(1);
        }
      });
      
      // Force close após 10 segundos
      setTimeout(() => {
        logger.error('⚠️ Forçando encerramento após timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada', { 
    reason: reason?.message || reason, 
    stack: reason?.stack,
    promise: promise.toString()
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada', { 
    error: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});

// Inicializa o servidor
const server = new Server();
server.start();
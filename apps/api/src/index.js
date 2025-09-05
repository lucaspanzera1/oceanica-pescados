const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();
const path = require('path');


// Importações locais
const { testConnection, initializeDatabase, closePool } = require('./database/config');
const { logger, httpLogger, logError } = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const addressRoutes = require('./routes/addressRoutes');

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
    this.app.use('/cart', limiter);
    this.app.use('/orders', limiter);
    this.app.use('/order-items', limiter);
    this.app.use('/addresses', limiter);
     this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    
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
        version: process.env.VERSAO || '1.0.0',
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

    // Rotas do carrinho
    this.app.use('/cart', cartRoutes);

    // Rotas de pedidos
    this.app.use('/orders', orderRoutes);

    // Rotas de itens de pedidos
    this.app.use('/order-items', orderItemRoutes);

    // Rotas de endereços
    this.app.use('/addresses', addressRoutes);

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
          cart: {
            'GET /cart': 'Obter carrinho (requer autenticação)',
            'GET /cart/count': 'Contar itens do carrinho (requer autenticação)',
            'POST /cart': 'Adicionar item ao carrinho (requer autenticação)',
            'PUT /cart/:productId': 'Atualizar quantidade (requer autenticação)',
            'DELETE /cart/:productId': 'Remover item (requer autenticação)',
            'DELETE /cart': 'Limpar carrinho (requer autenticação)'
          },
          orders: {
            'POST /orders': 'Criar pedido (requer autenticação)',
            'GET /orders/my': 'Listar meus pedidos (requer autenticação)',
            'GET /orders/:id': 'Buscar pedido por ID (requer autenticação)',
            'PATCH /orders/:id/cancel': 'Cancelar pedido (requer autenticação)',
            'GET /orders': 'Listar todos os pedidos (requer admin)',
            'GET /orders/statistics': 'Estatísticas de pedidos (requer admin)',
            'PATCH /orders/:id/status': 'Atualizar status do pedido (requer admin)'
          },
          orderItems: {
            'POST /order-items': 'Criar itens de pedido (requer autenticação)',
            'GET /order-items/order/:orderId': 'Listar itens de um pedido (requer autenticação)',
            'GET /order-items/:id': 'Buscar item por ID (requer autenticação)',
            'PUT /order-items/:id/quantity': 'Atualizar quantidade (requer autenticação)',
            'DELETE /order-items/:id': 'Remover item (requer autenticação)',
            'DELETE /order-items/order/:orderId': 'Remover todos os itens (requer autenticação)',
            'GET /order-items/order/:orderId/total': 'Calcular totais (requer autenticação)',
            'GET /order-items/product/:productId': 'Itens por produto (requer admin)',
            'GET /order-items/statistics/sales': 'Estatísticas de vendas (requer admin)'
          },
          addresses: {
            'POST /addresses': 'Criar endereço (requer autenticação)',
            'GET /addresses': 'Listar endereços (requer autenticação)',
            'GET /addresses/my': 'Listar meus endereços (requer autenticação)',
            'GET /addresses/:id': 'Buscar endereço por ID (requer autenticação)',
            'PUT /addresses/:id': 'Atualizar endereço (requer autenticação)',
            'DELETE /addresses/:id': 'Remover endereço (requer autenticação)',
            'GET /addresses/statistics': 'Estatísticas de endereços (requer admin)'
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
      logger.info('Iniciando servidor...');
      
      // Testa conexão com o banco
      await testConnection();
      
      // Inicializa as tabelas do banco
      await initializeDatabase();
      
      // Inicia o servidor
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        logger.info(`Servidor rodando na porta ${this.port}`, {
          environment: process.env.NODE_ENV,
          port: this.port,
          pid: process.pid
        });
        
        console.log(`URL local: http://localhost:${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`Rotas de auth: http://localhost:${this.port}/auth/*`);
        console.log(`Rotas de produtos: http://localhost:${this.port}/products/*`);
        console.log(`Rotas de carrinho: http://localhost:${this.port}/cart/*`);
        console.log(`Rotas de pedidos: http://localhost:${this.port}/orders/*`);
        console.log(`Rotas de itens de pedidos: http://localhost:${this.port}/order-items/*`);
        console.log(`Rotas de endereços: http://localhost:${this.port}/addresses/*`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('\nDocumentação das rotas:');
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
          console.log('  CARRINHO:');
          console.log('    GET /cart - Obter carrinho (requer token)');
          console.log('    GET /cart/count - Contar itens (requer token)');
          console.log('    POST /cart - Adicionar item (requer token)');
          console.log('    PUT /cart/:productId - Atualizar quantidade (requer token)');
          console.log('    DELETE /cart/:productId - Remover item (requer token)');
          console.log('    DELETE /cart - Limpar carrinho (requer token)');
          console.log('  PEDIDOS:');
          console.log('    POST /orders - Criar pedido (requer token)');
          console.log('    GET /orders/my - Meus pedidos (requer token)');
          console.log('    GET /orders/:id - Buscar pedido (requer token)');
          console.log('    PATCH /orders/:id/cancel - Cancelar pedido (requer token)');
          console.log('    GET /orders - Todos os pedidos (requer admin)');
          console.log('    GET /orders/statistics - Estatísticas (requer admin)');
          console.log('    PATCH /orders/:id/status - Atualizar status (requer admin)');
          console.log('  ITENS DE PEDIDOS:');
          console.log('    POST /order-items - Criar itens (requer token)');
          console.log('    GET /order-items/order/:orderId - Listar itens (requer token)');
          console.log('    GET /order-items/:id - Buscar item (requer token)');
          console.log('    PUT /order-items/:id/quantity - Atualizar quantidade (requer token)');
          console.log('    DELETE /order-items/:id - Remover item (requer token)');
          console.log('    DELETE /order-items/order/:orderId - Remover todos (requer token)');
          console.log('    GET /order-items/order/:orderId/total - Calcular totais (requer token)');
          console.log('    GET /order-items/product/:productId - Por produto (requer admin)');
          console.log('    GET /order-items/statistics/sales - Estatísticas (requer admin)');
          console.log('  ENDEREÇOS:');
          console.log('    POST /addresses - Criar endereço (requer token)');
          console.log('    GET /addresses - Listar endereços (requer token)');
          console.log('    GET /addresses/my - Meus endereços (requer token)');
          console.log('    GET /addresses/:id - Buscar endereço (requer token)');
          console.log('    PUT /addresses/:id - Atualizar endereço (requer token)');
          console.log('    DELETE /addresses/:id - Remover endereço (requer token)');
          console.log('    GET /addresses/statistics - Estatísticas (requer admin)');
        }
      });

      // Configurar graceful shutdown
      this.setupGracefulShutdown(server);

    } catch (error) {
      logger.error('Erro ao iniciar o servidor', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }
  
  /**
   * Configura o encerramento gracioso do servidor
   */
  setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} recebido, encerrando servidor graciosamente...`);
      
      server.close(async () => {
        logger.info('Servidor HTTP fechado');
        
        try {
          await closePool();
          logger.info('Shutdown gracioso concluído');
          process.exit(0);
        } catch (error) {
          logger.error('Erro durante shutdown', { error: error.message });
          process.exit(1);
        }
      });
      
      // Force close após 10 segundos
      setTimeout(() => {
        logger.error('Forçando encerramento após timeout');
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
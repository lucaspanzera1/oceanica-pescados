const OrderService = require('../services/orderService');
const { logError } = require('../config/logger');

/**
 * Controller responsável pelos endpoints de pedidos
 */
class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * POST /orders
   * Cria um novo pedido a partir do carrinho do usuário
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shipping_price = 0 } = req.body;

      // Validação do preço de frete
      let numericShipping = 0;
      if (shipping_price !== undefined && shipping_price !== null) {
        numericShipping = parseFloat(shipping_price);
        if (isNaN(numericShipping) || numericShipping < 0) {
          return res.status(400).json({
            success: false,
            message: 'Preço do frete deve ser um número válido maior ou igual a zero'
          });
        }
      }

      // Cria o pedido
      const order = await this.orderService.createOrder(userId, numericShipping);

      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        data: { order }
      });

    } catch (error) {
      logError(error, req);

      // Tratamento de erros específicos
      if (error.message.includes('Carrinho vazio') ||
          error.message.includes('Estoque insuficiente') ||
          error.message.includes('inválido') ||
          error.message.includes('deve ser')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /orders/:id
   * Busca pedido por ID (próprio pedido ou admin)
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const order = await this.orderService.findOrderById(id, userId, isAdmin);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Pedido encontrado com sucesso',
        data: { order }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /orders
   * Lista pedidos do usuário ou todos (se admin)
   */
  async listOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Validações
      const numericPage = parseInt(page);
      const numericLimit = parseInt(limit);

      if (isNaN(numericPage) || numericPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Página deve ser um número válido maior que zero'
        });
      }

      if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limite deve ser um número entre 1 e 100'
        });
      }

      const result = await this.orderService.listOrders({
        page: numericPage,
        limit: numericLimit,
        userId: isAdmin ? null : userId, // Admin pode ver todos
        isAdmin,
        status,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        message: 'Pedidos listados com sucesso',
        data: result
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido') || error.message.includes('inválida')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PATCH /orders/:id/status
   * Atualiza status do pedido (apenas admins)
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || status.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Status é obrigatório'
        });
      }

      const order = await this.orderService.updateOrderStatus(
        id, 
        status.toLowerCase().trim(), 
        true // isAdmin - middleware já validou
      );

      res.json({
        success: true,
        message: 'Status do pedido atualizado com sucesso',
        data: { order }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('inválido') ||
          error.message.includes('Não é possível alterar') ||
          error.message.includes('Apenas administradores')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PATCH /orders/:id/cancel
   * Cancela um pedido
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const order = await this.orderService.cancelOrder(id, userId, isAdmin);

      res.json({
        success: true,
        message: 'Pedido cancelado com sucesso',
        data: { order }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('inválido') ||
          error.message.includes('Não é possível cancelar')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /orders/statistics
   * Obtém estatísticas de pedidos (apenas admins)
   */
  async getStatistics(req, res) {
    try {
      const statistics = await this.orderService.getOrderStatistics();

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: { statistics }
      });

    } catch (error) {
      logError(error, req);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /orders/my
   * Lista apenas os pedidos do usuário logado
   */
  async getMyOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const userId = req.user.id;

      // Validações
      const numericPage = parseInt(page);
      const numericLimit = parseInt(limit);

      if (isNaN(numericPage) || numericPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Página deve ser um número válido maior que zero'
        });
      }

      if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 50) {
        return res.status(400).json({
          success: false,
          message: 'Limite deve ser um número entre 1 e 50'
        });
      }

      const result = await this.orderService.listOrders({
        page: numericPage,
        limit: numericLimit,
        userId,
        isAdmin: false,
        status,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        message: 'Seus pedidos listados com sucesso',
        data: result
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido') || error.message.includes('inválida')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new OrderController();
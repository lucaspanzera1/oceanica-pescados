const OrderItemService = require('../services/orderItemService');
const { logError } = require('../config/logger');

/**
 * Controller responsável pelos endpoints de itens de pedidos
 */
class OrderItemController {
  constructor() {
    this.orderItemService = new OrderItemService();
  }

  /**
   * POST /order-items
   * Cria itens de pedido (apenas admins ou dono do pedido)
   */
  async createOrderItems(req, res) {
    try {
      const { order_id, items } = req.body;

      // Validações básicas
      if (!order_id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de itens é obrigatória'
        });
      }

      // Validar cada item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.product_id) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: ID do produto é obrigatório`
          });
        }

        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Quantidade deve ser maior que zero`
          });
        }

        if (!item.price || item.price <= 0) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Preço deve ser maior que zero`
          });
        }

        // Validar tipos
        const quantity = parseInt(item.quantity);
        const price = parseFloat(item.price);

        if (isNaN(quantity)) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Quantidade deve ser um número válido`
          });
        }

        if (isNaN(price)) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: Preço deve ser um número válido`
          });
        }

        // Atualizar os valores convertidos
        item.quantity = quantity;
        item.price = price;
      }

      const createdItems = await this.orderItemService.createOrderItems(order_id, items);

      res.status(201).json({
        success: true,
        message: 'Itens do pedido criados com sucesso',
        data: { items: createdItems }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido') || 
          error.message.includes('obrigatório') || 
          error.message.includes('deve ser') ||
          error.message.includes('não encontrado')) {
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
   * GET /order-items/order/:orderId
   * Lista itens de um pedido específico
   */
  async getOrderItems(req, res) {
    try {
      const { orderId } = req.params;

      const items = await this.orderItemService.getOrderItems(orderId);

      res.json({
        success: true,
        message: 'Itens do pedido listados com sucesso',
        data: { items }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de pedido inválido')) {
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
   * GET /order-items/:id
   * Busca um item específico de pedido
   */
  async getOrderItemById(req, res) {
    try {
      const { id } = req.params;

      const item = await this.orderItemService.getOrderItemById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Item encontrado com sucesso',
        data: { item }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de item inválido')) {
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
   * PUT /order-items/:id/quantity
   * Atualiza quantidade de um item de pedido
   */
  async updateOrderItemQuantity(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade deve ser um número válido maior que zero'
        });
      }

      const updatedItem = await this.orderItemService.updateOrderItemQuantity(id, numericQuantity);

      res.json({
        success: true,
        message: 'Quantidade atualizada com sucesso',
        data: { item: updatedItem }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('inválido') || error.message.includes('deve ser')) {
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
   * DELETE /order-items/:id
   * Remove um item de pedido
   */
  async deleteOrderItem(req, res) {
    try {
      const { id } = req.params;

      const deleted = await this.orderItemService.deleteOrderItem(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Item removido com sucesso'
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('ID de item inválido')) {
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
   * DELETE /order-items/order/:orderId
   * Remove todos os itens de um pedido
   */
  async deleteOrderItems(req, res) {
    try {
      const { orderId } = req.params;

      const deletedCount = await this.orderItemService.deleteOrderItems(orderId);

      res.json({
        success: true,
        message: `${deletedCount} itens removidos com sucesso`,
        data: { deletedCount }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de pedido inválido')) {
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
   * GET /order-items/order/:orderId/total
   * Calcula totais de um pedido
   */
  async calculateOrderTotal(req, res) {
    try {
      const { orderId } = req.params;

      const totals = await this.orderItemService.calculateOrderTotal(orderId);

      res.json({
        success: true,
        message: 'Totais calculados com sucesso',
        data: { totals }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de pedido inválido')) {
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
   * GET /order-items/product/:productId
   * Lista itens de pedido por produto
   */
  async getOrderItemsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const numericLimit = parseInt(limit);
      const numericOffset = parseInt(offset);

      if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limite deve ser um número entre 1 e 100'
        });
      }

      if (isNaN(numericOffset) || numericOffset < 0) {
        return res.status(400).json({
          success: false,
          message: 'Offset deve ser um número maior ou igual a zero'
        });
      }

      const items = await this.orderItemService.getOrderItemsByProduct(productId, {
        limit: numericLimit,
        offset: numericOffset
      });

      res.json({
        success: true,
        message: 'Itens por produto listados com sucesso',
        data: { items }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de produto inválido')) {
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
   * GET /order-items/statistics/sales
   * Obter estatísticas de vendas
   */
  async getProductSalesStats(req, res) {
    try {
      const { 
        product_id, 
        start_date, 
        end_date, 
        limit = 10 
      } = req.query;

      const numericLimit = parseInt(limit);
      if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limite deve ser um número entre 1 e 100'
        });
      }

      const options = { limit: numericLimit };

      if (start_date) {
        options.startDate = new Date(start_date);
        if (isNaN(options.startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Data de início inválida'
          });
        }
      }

      if (end_date) {
        options.endDate = new Date(end_date);
        if (isNaN(options.endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Data de fim inválida'
          });
        }
      }

      const stats = await this.orderItemService.getProductSalesStats(product_id, options);

      res.json({
        success: true,
        message: 'Estatísticas de vendas obtidas com sucesso',
        data: { statistics: stats }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de produto inválido')) {
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

module.exports = new OrderItemController();
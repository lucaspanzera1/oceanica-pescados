const { pool } = require('../database/config');

/**
 * Service responsável pela lógica de itens de pedidos
 */
class OrderItemService {

  /**
   * Cria múltiplos itens de pedido
   * @param {string} orderId - UUID do pedido
   * @param {Array} items - Array de itens do pedido
   * @returns {Array} Itens de pedido criados
   */
  async createOrderItems(orderId, items) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!orderId || !this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Lista de itens é obrigatória');
      }

      // Verificar se o pedido existe
      const orderQuery = 'SELECT id FROM orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [orderId]);
      
      if (orderResult.rowCount === 0) {
        throw new Error('Pedido não encontrado');
      }

      const createdItems = [];

      for (const item of items) {
        const { product_id, quantity, price } = item;

        // Validações do item
        if (!product_id || !this.isValidUUID(product_id)) {
          throw new Error('ID de produto inválido');
        }

        if (!quantity || quantity <= 0) {
          throw new Error('Quantidade deve ser maior que zero');
        }

        if (!price || price <= 0) {
          throw new Error('Preço deve ser maior que zero');
        }

        // Verificar se o produto existe
        const productQuery = 'SELECT id, name FROM products WHERE id = $1';
        const productResult = await client.query(productQuery, [product_id]);
        
        if (productResult.rowCount === 0) {
          throw new Error(`Produto ${product_id} não encontrado`);
        }

        const subtotal = parseFloat(price) * parseInt(quantity);

        // Criar item do pedido
        const insertQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, order_id, product_id, quantity, price, subtotal, created_at
        `;

        const result = await client.query(insertQuery, [
          orderId,
          product_id,
          parseInt(quantity),
          parseFloat(price),
          subtotal
        ]);

        createdItems.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdItems;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar itens do pedido:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca todos os itens de um pedido
   * @param {string} orderId - UUID do pedido
   * @returns {Array} Lista de itens do pedido
   */
  async getOrderItems(orderId) {
    try {
      if (!orderId || !this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      const query = `
        SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          oi.subtotal,
          oi.created_at,
          p.name as product_name,
          p.description as product_description,
          p.image_url as product_image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC
      `;

      const result = await pool.query(query, [orderId]);
      return result.rows;

    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Busca um item específico de pedido
   * @param {string} itemId - UUID do item
   * @returns {Object|null} Item do pedido ou null se não encontrado
   */
  async getOrderItemById(itemId) {
    try {
      if (!itemId || !this.isValidUUID(itemId)) {
        throw new Error('ID de item inválido');
      }

      const query = `
        SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          oi.subtotal,
          oi.created_at,
          p.name as product_name,
          p.description as product_description,
          p.image_url as product_image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.id = $1
      `;

      const result = await pool.query(query, [itemId]);
      return result.rows[0] || null;

    } catch (error) {
      console.error('Erro ao buscar item do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza a quantidade de um item de pedido
   * @param {string} itemId - UUID do item
   * @param {number} quantity - Nova quantidade
   * @returns {Object} Item atualizado
   */
  async updateOrderItemQuantity(itemId, quantity) {
    try {
      if (!itemId || !this.isValidUUID(itemId)) {
        throw new Error('ID de item inválido');
      }

      if (!quantity || quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Buscar o item atual para recalcular subtotal
      const currentItem = await this.getOrderItemById(itemId);
      if (!currentItem) {
        throw new Error('Item não encontrado');
      }

      const newSubtotal = parseFloat(currentItem.price) * parseInt(quantity);

      const query = `
        UPDATE order_items 
        SET quantity = $1, subtotal = $2
        WHERE id = $3
        RETURNING id, order_id, product_id, quantity, price, subtotal, created_at
      `;

      const result = await pool.query(query, [
        parseInt(quantity),
        newSubtotal,
        itemId
      ]);

      return result.rows[0];

    } catch (error) {
      console.error('Erro ao atualizar item do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Remove um item de pedido
   * @param {string} itemId - UUID do item
   * @returns {boolean} True se removido com sucesso
   */
  async deleteOrderItem(itemId) {
    try {
      if (!itemId || !this.isValidUUID(itemId)) {
        throw new Error('ID de item inválido');
      }

      // Verificar se o item existe
      const existingItem = await this.getOrderItemById(itemId);
      if (!existingItem) {
        throw new Error('Item não encontrado');
      }

      const query = 'DELETE FROM order_items WHERE id = $1';
      const result = await pool.query(query, [itemId]);

      return result.rowCount > 0;

    } catch (error) {
      console.error('Erro ao deletar item do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Remove todos os itens de um pedido
   * @param {string} orderId - UUID do pedido
   * @returns {number} Número de itens removidos
   */
  async deleteOrderItems(orderId) {
    try {
      if (!orderId || !this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      const query = 'DELETE FROM order_items WHERE order_id = $1';
      const result = await pool.query(query, [orderId]);

      return result.rowCount;

    } catch (error) {
      console.error('Erro ao deletar itens do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Calcula o total de um pedido baseado nos seus itens
   * @param {string} orderId - UUID do pedido
   * @returns {Object} Totais do pedido
   */
  async calculateOrderTotal(orderId) {
    try {
      if (!orderId || !this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      const query = `
        SELECT 
          COUNT(*) as total_items,
          SUM(quantity) as total_quantity,
          SUM(subtotal) as total_amount
        FROM order_items 
        WHERE order_id = $1
      `;

      const result = await pool.query(query, [orderId]);
      const row = result.rows[0];

      return {
        totalItems: parseInt(row.total_items) || 0,
        totalQuantity: parseInt(row.total_quantity) || 0,
        totalAmount: parseFloat(row.total_amount) || 0
      };

    } catch (error) {
      console.error('Erro ao calcular total do pedido:', error.message);
      throw error;
    }
  }

  /**
   * Busca itens de pedido por produto
   * @param {string} productId - UUID do produto
   * @param {Object} options - Opções de busca
   * @returns {Array} Lista de itens
   */
  async getOrderItemsByProduct(productId, options = {}) {
    try {
      if (!productId || !this.isValidUUID(productId)) {
        throw new Error('ID de produto inválido');
      }

      const { limit = 50, offset = 0 } = options;

      const query = `
        SELECT 
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          oi.subtotal,
          oi.created_at,
          o.status as order_status,
          o.created_at as order_date
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = $1
        ORDER BY oi.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [productId, limit, offset]);
      return result.rows;

    } catch (error) {
      console.error('Erro ao buscar itens por produto:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas de vendas por produto
   * @param {string} productId - UUID do produto (opcional)
   * @param {Object} options - Opções de filtro
   * @returns {Array} Estatísticas de vendas
   */
  async getProductSalesStats(productId = null, options = {}) {
    try {
      const { startDate, endDate, limit = 10 } = options;

      let whereClause = '';
      let queryParams = [];
      let paramCount = 0;

      if (productId) {
        if (!this.isValidUUID(productId)) {
          throw new Error('ID de produto inválido');
        }
        whereClause += `WHERE oi.product_id = $${++paramCount}`;
        queryParams.push(productId);
      }

      if (startDate) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `oi.created_at >= $${++paramCount}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += whereClause ? ' AND ' : 'WHERE ';
        whereClause += `oi.created_at <= $${++paramCount}`;
        queryParams.push(endDate);
      }

      const query = `
        SELECT 
          oi.product_id,
          p.name as product_name,
          COUNT(oi.id) as total_orders,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.subtotal) as total_revenue,
          AVG(oi.price) as average_price,
          MIN(oi.created_at) as first_sale,
          MAX(oi.created_at) as last_sale
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        ${whereClause}
        GROUP BY oi.product_id, p.name
        ORDER BY total_revenue DESC
        LIMIT $${++paramCount}
      `;

      queryParams.push(limit);

      const result = await pool.query(query, queryParams);
      return result.rows;

    } catch (error) {
      console.error('Erro ao obter estatísticas de vendas:', error.message);
      throw error;
    }
  }

  /**
   * Valida se uma string é um UUID válido
   * @param {string} uuid - String para validar
   * @returns {boolean} True se for UUID válido
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = OrderItemService;
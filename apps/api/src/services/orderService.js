const { pool } = require('../database/config');
const OrderItemService = require('./orderItemService');

/**
 * Service responsável pela lógica de pedidos
 */
class OrderService {
  
  constructor() {
    this.orderItemService = new OrderItemService();
  }

  /**
   * Cria um pedido simplificado com apenas um produto
   * @param {Object} data - Dados do pedido {productId, username, phone}
   * @returns {Object} Dados do pedido criado
   */
  async createSimpleOrder(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { productId, username, phone } = data;

      // Buscar produto e validar estoque
      const productQuery = `
        SELECT id, name, price, stock
        FROM products
        WHERE id = $1
      `;
      
      const productResult = await client.query(productQuery, [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      const product = productResult.rows[0];

      // Validar estoque
      if (product.stock < 1) {
        throw new Error(`Estoque insuficiente para o produto "${product.name}"`);
      }

      // Criar usuário temporário
      const sanitizedPhone = phone.replace(/\D/g, '');
      const tempEmail = `temp_${sanitizedPhone}@temp.oceanica.local`;
      const tempPassword = `temp_${Math.random().toString(36).slice(2)}${Date.now()}`;
      
      const userQuery = `
        INSERT INTO users (name, phone, email, password, role)
        VALUES ($1, $2, $3, $4, 'customer')
        RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        username,
        phone,
        tempEmail,
        tempPassword
      ]);
      
      const userId = userResult.rows[0].id;

      // Criar o pedido
      const totalPrice = parseFloat(product.price);
      
      const orderQuery = `
        INSERT INTO orders (user_id, shipping_price, total_price) 
        VALUES ($1, $2, $3) 
        RETURNING id, user_id, status, shipping_price, total_price, created_at, updated_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        userId,
        0, // sem frete
        totalPrice
      ]);
      
      const order = orderResult.rows[0];

      // Criar item do pedido
      const orderItem = {
        product_id: productId,
        quantity: 1,
        price: parseFloat(product.price)
      };

      // Commit da transação atual para usar o OrderItemService
      await client.query('COMMIT');
      
      // Usar o OrderItemService para criar o item
      const orderItems = await this.orderItemService.createOrderItems(order.id, [orderItem]);

      // Nova transação para atualizar estoque
      await client.query('BEGIN');

      // Atualizar estoque do produto
      await client.query(
        'UPDATE products SET stock = stock - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [productId]
      );

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItems,
        total_products: totalPrice,
        customer: {
          name: username,
          phone
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cria um pedido externo (sem necessidade de usuário ou endereço cadastrado)
   */
  async createExternalOrder(items, customer, shipping_price = 0) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar disponibilidade de estoque
      for (const item of items) {
        const product = await client.query(
          'SELECT id, name, stock FROM products WHERE id = $1',
          [item.productId]
        );

        if (product.rows.length === 0) {
          throw new Error(`Produto não encontrado: ${item.productId}`);
        }
        
        if (product.rows[0].stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto: ${product.rows[0].name}`);
        }
      }

      // Calcular preço total
      let total_price = parseFloat(shipping_price);
      for (const item of items) {
        total_price += parseFloat(item.price) * parseInt(item.quantity);
      }

      // Criar o pedido
      const orderResult = await client.query(`
        INSERT INTO orders (
          status,
          shipping_price,
          total_price,
          user_name,
          user_phone,
          address_street,
          address_number,
          address_complement,
          address_neighborhood,
          address_city,
          address_state,
          address_zipcode,
          is_external
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        'pendente',
        shipping_price,
        total_price,
        customer.name,
        customer.phone,
        customer.street,
        customer.number,
        customer.complement || null,
        customer.neighborhood,
        customer.city,
        customer.state,
        customer.zipcode,
        true
      ]);

      const order = orderResult.rows[0];

      // Criar itens do pedido e atualizar estoque
      const orderItems = [];
      for (const item of items) {
        // Criar item do pedido
        const orderItem = await client.query(`
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price,
            subtotal
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          order.id,
          item.productId,
          item.quantity,
          item.price,
          parseFloat(item.price) * item.quantity
        ]);

        orderItems.push(orderItem.rows[0]);

        // Atualizar estoque
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItems
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cria um novo pedido a partir do carrinho do usuário
   * @param {string} userId - UUID do usuário
   * @param {number} shippingPrice - Preço do frete
   * @returns {Object} Dados do pedido criado
   */
  async createOrder(userId, shippingPrice = 0, addressId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      if (shippingPrice < 0) {
        throw new Error('Preço do frete não pode ser negativo');
      }

      if (!this.isValidUUID(addressId)) {
        throw new Error('ID de endereço inválido');
      }

      // Verificar se o endereço existe e pertence ao usuário
      const addressQuery = `
        SELECT id FROM addresses WHERE id = $1 AND user_id = $2
      `;
      const addressResult = await client.query(addressQuery, [addressId, userId]);
      
      if (addressResult.rows.length === 0) {
        throw new Error('Endereço não encontrado ou não pertence ao usuário');
      }

      // Buscar itens do carrinho com produtos
      const cartQuery = `
        SELECT ci.id, ci.user_id, ci.product_id, ci.quantity,
               p.name, p.description, p.price, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at
      `;
      
      const cartResult = await client.query(cartQuery, [userId]);
      const cartItems = cartResult.rows;

      if (cartItems.length === 0) {
        throw new Error('Carrinho vazio. Adicione produtos antes de criar um pedido.');
      }

      // Verificar disponibilidade de estoque
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto "${item.name}". Disponível: ${item.stock}, Solicitado: ${item.quantity}`);
        }
      }

      // Calcular total dos produtos
      const totalProducts = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
      }, 0);

      const totalPrice = totalProducts + parseFloat(shippingPrice);

      // Criar o pedido (sem os itens ainda)
      const orderQuery = `
        INSERT INTO orders (user_id, shipping_price, total_price, address_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, user_id, status, shipping_price, total_price, address_id, created_at, updated_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        userId,
        parseFloat(shippingPrice),
        totalPrice,
        addressId
      ]);
      
      const order = orderResult.rows[0];

      // Preparar itens para o OrderItemService
      const itemsForOrderService = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price)
      }));

      // Usar o OrderItemService para criar os itens
      // Primeiro, fazemos commit da transação atual
      await client.query('COMMIT');
      
      // Agora usamos o OrderItemService (que tem sua própria transação)
      const orderItems = await this.orderItemService.createOrderItems(order.id, itemsForOrderService);

      // Iniciar nova transação para atualizar estoque e limpar carrinho
      await client.query('BEGIN');

      // Atualizar estoque dos produtos
      for (const item of cartItems) {
        await client.query(
          'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Limpar carrinho do usuário
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItems,
        total_products: totalProducts
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar pedido:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca pedido por ID com seus itens
   * @param {string} orderId - UUID do pedido
   * @param {string} userId - UUID do usuário (para validação de propriedade)
   * @param {boolean} isAdmin - Se é admin (pode ver qualquer pedido)
   * @returns {Object|null} Dados do pedido ou null se não encontrado
   */
  async findOrderById(orderId, userId = null, isAdmin = false) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      // Query base do pedido
      let orderQuery = `
        SELECT o.id, o.user_id, o.status, o.shipping_price, o.total_price, 
               o.created_at, o.updated_at, o.address_id,
               u.email as user_email, u.name as user_name, u.phone as user_phone,
               a.street, a.neighborhood, a.city, a.state, a.postal_code
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN addresses a ON o.address_id = a.id
        WHERE o.id = $1
      `;
      
      let queryParams = [orderId];

      // Se não for admin, adicionar filtro por usuário
      if (!isAdmin && userId) {
        if (!this.isValidUUID(userId)) {
          throw new Error('ID de usuário inválido');
        }
        orderQuery += ' AND o.user_id = $2';
        queryParams.push(userId);
      }

      const orderResult = await pool.query(orderQuery, queryParams);
      
      if (orderResult.rows.length === 0) {
        return null;
      }

      const order = orderResult.rows[0];

      // Buscar itens do pedido usando o OrderItemService
      const items = await this.orderItemService.getOrderItems(orderId);
      
      return {
        ...order,
        items
      };
      
    } catch (error) {
      console.error('Erro ao buscar pedido por ID:', error.message);
      throw error;
    }
  }

  /**
   * Lista pedidos do usuário ou todos (se admin)
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista de pedidos e metadados
   */
  async listOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        userId = null,
        isAdmin = false,
        status = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // Validar parâmetros
      const validSortFields = ['created_at', 'updated_at', 'total_price', 'status'];
      const validSortOrders = ['ASC', 'DESC'];
      const validStatuses = ['pendente', 'confirmado', 'enviado', 'cancelado'];

      if (!validSortFields.includes(sortBy)) {
        throw new Error('Campo de ordenação inválido');
      }

      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error('Ordem de classificação inválida');
      }

      if (status && !validStatuses.includes(status)) {
        throw new Error('Status de pedido inválido');
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construir WHERE clause
      const whereConditions = [];
      const queryParams = [];
      let paramCounter = 1;

      // Filtro por usuário (se não for admin)
      if (!isAdmin && userId) {
        if (!this.isValidUUID(userId)) {
          throw new Error('ID de usuário inválido');
        }
        whereConditions.push(`o.user_id = $${paramCounter++}`);
        queryParams.push(userId);
      }

      // Filtro por status
      if (status) {
        whereConditions.push(`o.status = $${paramCounter++}`);
        queryParams.push(status);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query principal
      const query = `
        SELECT o.id, o.user_id, o.status, o.shipping_price, o.total_price, 
               o.created_at, o.updated_at, o.address_id,
               u.email as user_email, u.name as user_name, u.phone as user_phone,
               COUNT(oi.id) as items_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ${whereClause}
        GROUP BY o.id, u.email, u.name, u.phone
        ORDER BY o.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;

      queryParams.push(parseInt(limit), offset);
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(DISTINCT o.id) as total 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remove LIMIT e OFFSET

      // Executar as queries
      const [ordersResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const orders = ordersResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        }
      };
      
    } catch (error) {
      console.error('Erro ao listar pedidos:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza o status de um pedido
   * @param {string} orderId - UUID do pedido
   * @param {string} newStatus - Novo status
   * @param {boolean} isAdmin - Se é admin (só admin pode alterar status)
   * @returns {Object} Pedido atualizado
   */
  async updateOrderStatus(orderId, newStatus, isAdmin = false) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      if (!isAdmin) {
        throw new Error('Apenas administradores podem alterar o status de pedidos');
      }

      const validStatuses = ['pendente', 'confirmado', 'enviado', 'cancelado'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Status inválido');
      }

      // Buscar pedido atual
      const currentOrderQuery = 'SELECT * FROM orders WHERE id = $1';
      const currentOrderResult = await client.query(currentOrderQuery, [orderId]);
      
      if (currentOrderResult.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }

      const currentOrder = currentOrderResult.rows[0];

      // Validar transições de status
      const validTransitions = {
        'pendente': ['confirmado', 'cancelado'],
        'confirmado': ['enviado', 'cancelado'],
        'enviado': [], // Pedidos enviados não podem mudar status
        'cancelado': [] // Pedidos cancelados não podem mudar status
      };

      if (!validTransitions[currentOrder.status].includes(newStatus)) {
        throw new Error(`Não é possível alterar status de "${currentOrder.status}" para "${newStatus}"`);
      }

      // Se cancelando pedido, devolver estoque
      if (newStatus === 'cancelado' && currentOrder.status !== 'cancelado') {
        const items = await this.orderItemService.getOrderItems(orderId);
        
        for (const item of items) {
          await client.query(
            'UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
      }

      // Atualizar status do pedido
      const updateQuery = `
        UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, user_id, status, shipping_price, total_price, created_at, updated_at, address_id
      `;

      const result = await client.query(updateQuery, [newStatus, orderId]);

      await client.query('COMMIT');
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar status do pedido:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancela um pedido (apenas pelo próprio usuário ou admin)
   * @param {string} orderId - UUID do pedido
   * @param {string} userId - UUID do usuário
   * @param {boolean} isAdmin - Se é admin
   * @returns {Object} Pedido cancelado
   */
  async cancelOrder(orderId, userId, isAdmin = false) {
    try {
      // Validações
      if (!this.isValidUUID(orderId)) {
        throw new Error('ID de pedido inválido');
      }

      if (!isAdmin && !this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      // Verificar se o pedido existe e pertence ao usuário
      let orderQuery = 'SELECT * FROM orders WHERE id = $1';
      let queryParams = [orderId];

      if (!isAdmin) {
        orderQuery += ' AND user_id = $2';
        queryParams.push(userId);
      }

      const orderResult = await pool.query(orderQuery, queryParams);
      
      if (orderResult.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }

      const order = orderResult.rows[0];

      // Só pode cancelar pedidos pendentes ou confirmados
      if (!['pendente', 'confirmado'].includes(order.status)) {
        throw new Error(`Não é possível cancelar pedido com status "${order.status}"`);
      }

      return await this.updateOrderStatus(orderId, 'cancelado', true);
      
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de pedidos (para admins)
   * @returns {Object} Estatísticas dos pedidos
   */
  async getOrderStatistics() {
    try {
      const queries = {
        // Total de pedidos por status
        statusCount: `
          SELECT status, COUNT(*) as count
          FROM orders
          GROUP BY status
          ORDER BY status
        `,
        // Receita total
        totalRevenue: `
          SELECT 
            SUM(total_price) as total_revenue,
            AVG(total_price) as average_order_value,
            COUNT(*) as total_orders
          FROM orders 
          WHERE status != 'cancelado'
        `,
        // Pedidos por mês (últimos 12 meses)
        monthlyOrders: `
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as orders_count,
            SUM(CASE WHEN status != 'cancelado' THEN total_price ELSE 0 END) as revenue
          FROM orders
          WHERE created_at >= NOW() - INTERVAL '12 months'
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY month DESC
        `,
        // Produtos mais vendidos (usando OrderItemService)
        topProducts: `
          SELECT 
            oi.product_id,
            p.name as product_name,
            SUM(oi.quantity) as total_quantity,
            COUNT(DISTINCT oi.order_id) as orders_count,
            SUM(oi.subtotal) as total_revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN products p ON oi.product_id = p.id
          WHERE o.status != 'cancelado'
          GROUP BY oi.product_id, p.name
          ORDER BY total_quantity DESC
          LIMIT 10
        `
      };

      const [statusResult, revenueResult, monthlyResult, productsResult] = await Promise.all([
        pool.query(queries.statusCount),
        pool.query(queries.totalRevenue),
        pool.query(queries.monthlyOrders),
        pool.query(queries.topProducts)
      ]);

      return {
        statusCounts: statusResult.rows,
        revenue: revenueResult.rows[0],
        monthlyData: monthlyResult.rows,
        topProducts: productsResult.rows
      };
      
    } catch (error) {
      console.error('Erro ao obter estatísticas de pedidos:', error.message);
      throw error;
    }
  }

  /**
   * Cria um pedido diretamente pelo admin, sem necessidade de carrinho
   * @param {Object[]} items - Array de itens {product_id, quantity}
   * @param {Object} customerInfo - Informações do cliente {name, phone}
   * @param {number} shippingPrice - Preço do frete
   * @returns {Object} Dados do pedido criado
   */
  async createAdminOrder(items, customerInfo, shippingPrice = 0) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('É necessário informar pelo menos um item para o pedido');
      }

      if (!customerInfo?.name || !customerInfo?.phone) {
        throw new Error('Nome e telefone do cliente são obrigatórios');
      }

      if (shippingPrice < 0) {
        throw new Error('Preço do frete não pode ser negativo');
      }

      // Buscar produtos e validar estoque
      const productIds = items.map(item => item.product_id);
      const productsQuery = `
        SELECT id, name, price, stock
        FROM products
        WHERE id = ANY($1::uuid[])
      `;
      
      const productsResult = await client.query(productsQuery, [productIds]);
      const products = productsResult.rows;

      if (products.length !== productIds.length) {
        throw new Error('Um ou mais produtos não foram encontrados');
      }

      // Criar usuário temporário para o pedido com email fictício e senha aleatória
      const sanitizedPhone = customerInfo.phone.replace(/\D/g, '');
      const tempEmail = `temp_${sanitizedPhone}@temp.oceanica.local`;
      const tempPassword = `temp_${Math.random().toString(36).slice(2)}${Date.now()}`;
      
      const userQuery = `
        INSERT INTO users (name, phone, email, password, role)
        VALUES ($1, $2, $3, $4, 'customer')
        RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        customerInfo.name,
        customerInfo.phone,
        tempEmail,
        tempPassword
      ]);
      
      const userId = userResult.rows[0].id;

      // Validar estoque e calcular total
      let totalProducts = 0;
      const productsMap = new Map(products.map(p => [p.id, p]));

      for (const item of items) {
        const product = productsMap.get(item.product_id);
        if (product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
        }
        totalProducts += parseFloat(product.price) * parseInt(item.quantity);
      }

      const totalPrice = totalProducts + parseFloat(shippingPrice);

      // Criar o pedido
      const orderQuery = `
        INSERT INTO orders (user_id, shipping_price, total_price) 
        VALUES ($1, $2, $3) 
        RETURNING id, user_id, status, shipping_price, total_price, created_at, updated_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        userId,
        parseFloat(shippingPrice),
        totalPrice
      ]);
      
      const order = orderResult.rows[0];

      // Preparar itens para o OrderItemService
      const itemsForOrderService = items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(productsMap.get(item.product_id).price)
      }));

      // Commit da transação atual para usar o OrderItemService
      await client.query('COMMIT');
      
      // Usar o OrderItemService para criar os itens
      const orderItems = await this.orderItemService.createOrderItems(order.id, itemsForOrderService);

      // Nova transação para atualizar estoque
      await client.query('BEGIN');

      // Atualizar estoque dos produtos
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItems,
        total_products: totalProducts,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cria um pedido externo (pedido para cliente não registrado)
   * @param {Object[]} items - Array de itens {product_id, quantity}
   * @param {Object} customerInfo - Informações do cliente {name, phone}
   * @param {Object} address - Endereço de entrega
   * @param {number} shippingPrice - Preço do frete
   * @returns {Object} Dados do pedido criado
   */
  async createExternalOrder(items, customerInfo, address, shippingPrice = 0) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('É necessário informar pelo menos um item para o pedido');
      }

      if (!customerInfo?.name || !customerInfo?.phone) {
        throw new Error('Nome e telefone do cliente são obrigatórios');
      }

      if (!address || !address.street || !address.city || !address.state || !address.postal_code) {
        throw new Error('Endereço completo é obrigatório');
      }

      if (shippingPrice < 0) {
        throw new Error('Preço do frete não pode ser negativo');
      }

      // Buscar produtos e validar estoque
      const productIds = items.map(item => item.product_id);
      const productsQuery = `
        SELECT id, name, price, stock
        FROM products
        WHERE id = ANY($1::uuid[])
      `;
      
      const productsResult = await client.query(productsQuery, [productIds]);
      const products = productsResult.rows;

      if (products.length !== productIds.length) {
        throw new Error('Um ou mais produtos não foram encontrados');
      }

      // Criar usuário temporário para o pedido com email fictício e senha aleatória
      const sanitizedPhone = customerInfo.phone.replace(/\D/g, '');
      const tempEmail = `temp_${sanitizedPhone}@temp.oceanica.local`;
      const tempPassword = `temp_${Math.random().toString(36).slice(2)}${Date.now()}`;
      
      const userQuery = `
        INSERT INTO users (name, phone, email, password, role)
        VALUES ($1, $2, $3, $4, 'customer')
        RETURNING id
      `;
      
      const userResult = await client.query(userQuery, [
        customerInfo.name,
        customerInfo.phone,
        tempEmail,
        tempPassword
      ]);
      
      const userId = userResult.rows[0].id;

      // Criar endereço para o usuário
      const addressQuery = `
        INSERT INTO addresses (
          user_id, street, number, complement, neighborhood,
          city, state, postal_code, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id
      `;

      const addressResult = await client.query(addressQuery, [
        userId,
        address.street,
        address.number || '',
        address.complement || '',
        address.neighborhood || '',
        address.city,
        address.state,
        address.postal_code
      ]);

      const addressId = addressResult.rows[0].id;

      // Validar estoque e calcular total
      let totalProducts = 0;
      const productsMap = new Map(products.map(p => [p.id, p]));

      for (const item of items) {
        const product = productsMap.get(item.product_id);
        if (product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
        }
        totalProducts += parseFloat(product.price) * parseInt(item.quantity);
      }

      const totalPrice = totalProducts + parseFloat(shippingPrice);

      // Criar o pedido
      const orderQuery = `
        INSERT INTO orders (user_id, shipping_price, total_price, address_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, user_id, status, shipping_price, total_price, address_id, created_at, updated_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        userId,
        parseFloat(shippingPrice),
        totalPrice,
        addressId
      ]);
      
      const order = orderResult.rows[0];

      // Preparar itens para o OrderItemService
      const itemsForOrderService = items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(productsMap.get(item.product_id).price)
      }));

      // Commit da transação atual para usar o OrderItemService
      await client.query('COMMIT');
      
      // Usar o OrderItemService para criar os itens
      const orderItems = await this.orderItemService.createOrderItems(order.id, itemsForOrderService);

      // Nova transação para atualizar estoque
      await client.query('BEGIN');

      // Atualizar estoque dos produtos
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');

      return {
        ...order,
        items: orderItems,
        total_products: totalProducts,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone
        },
        address
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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

module.exports = OrderService;
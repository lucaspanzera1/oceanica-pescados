const { pool } = require('../database/config');

/**
 * Service responsável pela lógica do carrinho de compras
 */
class CartService {
  
  /**
   * Adiciona um item ao carrinho ou atualiza a quantidade se já existir
   * @param {string} userId - UUID do usuário
   * @param {string} productId - UUID do produto
   * @param {number} quantity - Quantidade do produto
   * @returns {Object} Item do carrinho criado/atualizado
   */
  async addItemToCart(userId, productId, quantity) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      if (!this.isValidUUID(productId)) {
        throw new Error('ID de produto inválido');
      }

      if (!quantity || quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity)) {
        throw new Error('Quantidade deve ser um número válido');
      }

      // Verificar se o produto existe e tem estoque suficiente
      const productQuery = 'SELECT id, name, price, stock FROM products WHERE id = $1';
      const productResult = await client.query(productQuery, [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      const product = productResult.rows[0];
      
      if (product.stock < numericQuantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock} unidades`);
      }

      // Verificar se o item já existe no carrinho
      const existingItemQuery = `
        SELECT id, quantity 
        FROM cart_items 
        WHERE user_id = $1 AND product_id = $2
      `;
      const existingItem = await client.query(existingItemQuery, [userId, productId]);

      let result;

      if (existingItem.rows.length > 0) {
        // Atualizar quantidade do item existente
        const newQuantity = existingItem.rows[0].quantity + numericQuantity;
        
        // Verificar se a nova quantidade não excede o estoque
        if (newQuantity > product.stock) {
          throw new Error(`Estoque insuficiente. Você já tem ${existingItem.rows[0].quantity} no carrinho. Máximo possível: ${product.stock - existingItem.rows[0].quantity}`);
        }

        const updateQuery = `
          UPDATE cart_items 
          SET quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2 AND product_id = $3
          RETURNING id, user_id, product_id, quantity, created_at, updated_at
        `;
        result = await client.query(updateQuery, [newQuantity, userId, productId]);
      } else {
        // Inserir novo item no carrinho
        const insertQuery = `
          INSERT INTO cart_items (user_id, product_id, quantity)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, product_id, quantity, created_at, updated_at
        `;
        result = await client.query(insertQuery, [userId, productId, numericQuantity]);
      }

      await client.query('COMMIT');

      // Buscar dados completos do item para retorno
      const cartItem = await this.getCartItemDetails(result.rows[0].id);
      return cartItem;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao adicionar item ao carrinho:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove um item do carrinho
   * @param {string} userId - UUID do usuário
   * @param {string} productId - UUID do produto
   * @returns {boolean} True se removido com sucesso
   */
  async removeItemFromCart(userId, productId) {
    try {
      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      if (!this.isValidUUID(productId)) {
        throw new Error('ID de produto inválido');
      }

      const query = 'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2';
      const result = await pool.query(query, [userId, productId]);

      return result.rowCount > 0;

    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param {string} userId - UUID do usuário
   * @param {string} productId - UUID do produto
   * @param {number} quantity - Nova quantidade
   * @returns {Object} Item do carrinho atualizado
   */
  async updateCartItemQuantity(userId, productId, quantity) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      if (!this.isValidUUID(productId)) {
        throw new Error('ID de produto inválido');
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        throw new Error('Quantidade deve ser um número válido maior que zero');
      }

      // Verificar se o produto tem estoque suficiente
      const productQuery = 'SELECT stock FROM products WHERE id = $1';
      const productResult = await client.query(productQuery, [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }

      if (productResult.rows[0].stock < numericQuantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${productResult.rows[0].stock} unidades`);
      }

      // Atualizar quantidade
      const updateQuery = `
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND product_id = $3
        RETURNING id, user_id, product_id, quantity, created_at, updated_at
      `;
      const result = await client.query(updateQuery, [numericQuantity, userId, productId]);

      if (result.rowCount === 0) {
        throw new Error('Item não encontrado no carrinho');
      }

      await client.query('COMMIT');

      // Buscar dados completos do item para retorno
      const cartItem = await this.getCartItemDetails(result.rows[0].id);
      return cartItem;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao atualizar quantidade do item:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca todos os itens do carrinho de um usuário
   * @param {string} userId - UUID do usuário
   * @returns {Object} Dados do carrinho com itens e totais
   */
  async getCartByUserId(userId) {
    try {
      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      const query = `
        SELECT 
          ci.id,
          ci.user_id,
          ci.product_id,
          ci.quantity,
          ci.created_at,
          ci.updated_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.image_url as product_image,
          p.stock as product_stock,
          (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      const items = result.rows;

      // Calcular totais
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

      return {
        userId,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          product: {
            name: item.product_name,
            description: item.product_description,
            price: parseFloat(item.product_price),
            imageUrl: item.product_image,
            stock: item.product_stock
          },
          subtotal: parseFloat(item.subtotal)
        })),
        summary: {
          totalItems,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          itemCount: items.length
        }
      };

    } catch (error) {
      console.error('Erro ao buscar carrinho:', error.message);
      throw error;
    }
  }

  /**
   * Limpa todos os itens do carrinho de um usuário
   * @param {string} userId - UUID do usuário
   * @returns {boolean} True se limpo com sucesso
   */
  async clearCart(userId) {
    try {
      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      const query = 'DELETE FROM cart_items WHERE user_id = $1';
      const result = await pool.query(query, [userId]);

      return result.rowCount >= 0; // True mesmo se não havia itens

    } catch (error) {
      console.error('Erro ao limpar carrinho:', error.message);
      throw error;
    }
  }

  /**
   * Conta quantos itens únicos um usuário tem no carrinho
   * @param {string} userId - UUID do usuário
   * @returns {Object} Contadores do carrinho
   */
  async getCartItemsCount(userId) {
    try {
      // Validações
      if (!this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      const query = `
        SELECT 
          COUNT(*) as unique_items,
          COALESCE(SUM(quantity), 0) as total_quantity
        FROM cart_items 
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);
      const row = result.rows[0];

      return {
        uniqueItems: parseInt(row.unique_items),
        totalQuantity: parseInt(row.total_quantity)
      };

    } catch (error) {
      console.error('Erro ao contar itens do carrinho:', error.message);
      throw error;
    }
  }

  /**
   * Busca detalhes completos de um item do carrinho
   * @param {string} cartItemId - UUID do item do carrinho
   * @returns {Object} Detalhes do item
   */
  async getCartItemDetails(cartItemId) {
    try {
      if (!this.isValidUUID(cartItemId)) {
        throw new Error('ID de item inválido');
      }

      const query = `
        SELECT 
          ci.id,
          ci.user_id,
          ci.product_id,
          ci.quantity,
          ci.created_at,
          ci.updated_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.image_url as product_image,
          p.stock as product_stock,
          (ci.quantity * p.price) as subtotal
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.id = $1
      `;

      const result = await pool.query(query, [cartItemId]);
      
      if (result.rows.length === 0) {
        throw new Error('Item do carrinho não encontrado');
      }

      const item = result.rows[0];

      return {
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        quantity: item.quantity,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        product: {
          name: item.product_name,
          description: item.product_description,
          price: parseFloat(item.product_price),
          imageUrl: item.product_image,
          stock: item.product_stock
        },
        subtotal: parseFloat(item.subtotal)
      };

    } catch (error) {
      console.error('Erro ao buscar detalhes do item:', error.message);
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

module.exports = CartService;
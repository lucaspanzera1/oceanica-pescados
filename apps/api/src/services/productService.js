const { pool } = require('../database/config');

/**
 * Service responsável pela lógica de produtos
 */
class ProductService {
  
  /**
   * Cria um novo produto no sistema
   * @param {Object} productData - Dados do produto
   * @returns {Object} Dados do produto criado
   */
  async createProduct(productData) {
    try {
      const { name, description, price, stock = 0, image_url, image_url1 } = productData;

      // Validações
      if (!name || name.trim().length === 0) {
        throw new Error('Nome do produto é obrigatório');
      }

      if (!price || price <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }

      if (stock < 0) {
        throw new Error('Estoque não pode ser negativo');
      }

      // Insere o produto no banco
      const query = `
        INSERT INTO products (name, description, price, stock, image_url, image_url1) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, name, description, price, stock, image_url, image_url1, created_at, updated_at
      `;
      
      const result = await pool.query(query, [
        name.trim(),
        description?.trim() || null,
        parseFloat(price),
        parseInt(stock),
        image_url?.trim() || null,
        image_url1?.trim() || null
      ]);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao criar produto:', error.message);
      throw error;
    }
  }

  /**
   * Busca produto por ID (UUID)
   * @param {string} id - UUID do produto
   * @returns {Object|null} Dados do produto ou null se não encontrado
   */
  async findProductById(id) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(id)) {
        throw new Error('ID de produto inválido');
      }

      const query = `
        SELECT id, name, description, price, stock, image_url, image_url1, created_at, updated_at 
        FROM products 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar produto por ID:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos os produtos com paginação
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista de produtos e metadados
   */
  async listProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // Validar parâmetros
      const validSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at'];
      const validSortOrders = ['ASC', 'DESC'];

      if (!validSortFields.includes(sortBy)) {
        throw new Error('Campo de ordenação inválido');
      }

      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error('Ordem de classificação inválida');
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const searchPattern = `%${search.trim()}%`;

      // Query principal com busca
      let whereClause = '';
      let queryParams = [];
      
      if (search.trim()) {
        whereClause = 'WHERE name ILIKE $1 OR description ILIKE $1';
        queryParams.push(searchPattern);
      }

      const query = `
        SELECT id, name, description, price, stock, image_url, image_url1, created_at, updated_at 
        FROM products 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      queryParams.push(parseInt(limit), offset);
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM products 
        ${whereClause}
      `;
      
      const countParams = search.trim() ? [searchPattern] : [];

      // Executar as queries
      const [productsResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const products = productsResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      return {
        products,
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
      console.error('Erro ao listar produtos:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza um produto existente
   * @param {string} id - UUID do produto
   * @param {Object} updateData - Dados para atualizar
   * @returns {Object} Produto atualizado
   */
  async updateProduct(id, updateData) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(id)) {
        throw new Error('ID de produto inválido');
      }

      // Verificar se o produto existe
      const existingProduct = await this.findProductById(id);
      if (!existingProduct) {
        throw new Error('Produto não encontrado');
      }

      const { name, description, price, stock, image_url, image_url1 } = updateData;

      // Validações
      if (name !== undefined && (!name || name.trim().length === 0)) {
        throw new Error('Nome do produto é obrigatório');
      }

      if (price !== undefined && (price <= 0)) {
        throw new Error('Preço deve ser maior que zero');
      }

      if (stock !== undefined && stock < 0) {
        throw new Error('Estoque não pode ser negativo');
      }

      // Construir query de atualização dinamicamente
      const updates = [];
      const values = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCounter++}`);
        values.push(name.trim());
      }

      if (description !== undefined) {
        updates.push(`description = $${paramCounter++}`);
        values.push(description?.trim() || null);
      }

      if (price !== undefined) {
        updates.push(`price = $${paramCounter++}`);
        values.push(parseFloat(price));
      }

      if (stock !== undefined) {
        updates.push(`stock = $${paramCounter++}`);
        values.push(parseInt(stock));
      }

      if (image_url !== undefined) {
        updates.push(`image_url = $${paramCounter++}`);
        values.push(image_url?.trim() || null);
      }

      if (image_url1 !== undefined) {
        updates.push(`image_url1 = $${paramCounter++}`);
        values.push(image_url1?.trim() || null);
      }

      if (updates.length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
      }

      // Adicionar updated_at e id nos parâmetros
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE products 
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, name, description, price, stock, image_url, image_url1, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao atualizar produto:', error.message);
      throw error;
    }
  }

  /**
   * Remove um produto do sistema
   * @param {string} id - UUID do produto
   * @returns {boolean} True se removido com sucesso
   */
  async deleteProduct(id) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(id)) {
        throw new Error('ID de produto inválido');
      }

      // Verificar se o produto existe
      const existingProduct = await this.findProductById(id);
      if (!existingProduct) {
        throw new Error('Produto não encontrado');
      }

      const query = 'DELETE FROM products WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      return result.rowCount > 0;
      
    } catch (error) {
      console.error('Erro ao deletar produto:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza apenas o estoque de um produto
   * @param {string} id - UUID do produto
   * @param {number} quantity - Quantidade a adicionar/remover (pode ser negativa)
   * @returns {Object} Produto com estoque atualizado
   */
  async updateStock(id, quantity) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(id)) {
        throw new Error('ID de produto inválido');
      }

      if (typeof quantity !== 'number' || isNaN(quantity)) {
        throw new Error('Quantidade deve ser um número válido');
      }

      const query = `
        UPDATE products 
        SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND (stock + $1) >= 0
        RETURNING id, name, description, price, stock, image_url, image_url1, created_at, updated_at
      `;

      const result = await pool.query(query, [quantity, id]);
      
      if (result.rowCount === 0) {
        const product = await this.findProductById(id);
        if (!product) {
          throw new Error('Produto não encontrado');
        }
        throw new Error('Operação resultaria em estoque negativo');
      }

      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error.message);
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

module.exports = ProductService;
const { pool } = require('../database/config');

/**
 * Service responsável pela lógica de endereços de entrega
 */
class AddressService {

  /**
   * Cria um novo endereço para o usuário
   * @param {string} userId - UUID do usuário
   * @param {Object} addressData - Dados do endereço
   * @returns {Object} Endereço criado
   */
  async createAddress(userId, addressData) {
    try {
      // Validações
      if (!userId || !this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      const { street, city, state, postal_code, number, complement } = addressData;

      // Validações obrigatórias
      if (!street || street.trim().length === 0) {
        throw new Error('Rua é obrigatória');
      }

      if (!city || city.trim().length === 0) {
        throw new Error('Cidade é obrigatória');
      }

      if (!state || state.trim().length === 0) {
        throw new Error('Estado é obrigatório');
      }

      if (!postal_code || postal_code.trim().length === 0) {
        throw new Error('CEP é obrigatório');
      }

      // Validação de tamanhos
      if (street.trim().length > 255) {
        throw new Error('Rua deve ter no máximo 255 caracteres');
      }

      if (city.trim().length > 100) {
        throw new Error('Cidade deve ter no máximo 100 caracteres');
      }

      if (state.trim().length > 50) {
        throw new Error('Estado deve ter no máximo 50 caracteres');
      }

      if (postal_code.trim().length > 20) {
        throw new Error('CEP deve ter no máximo 20 caracteres');
      }

      if (number && number.trim().length > 20) {
        throw new Error('Número deve ter no máximo 20 caracteres');
      }

      if (complement && complement.trim().length > 255) {
        throw new Error('Complemento deve ter no máximo 255 caracteres');
      }

      // Verificar se o usuário existe
      const userQuery = 'SELECT id FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rowCount === 0) {
        throw new Error('Usuário não encontrado');
      }

      const query = `
        INSERT INTO addresses (user_id, street, city, state, postal_code, number, complement)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, street, city, state, postal_code, number, complement, created_at
      `;

      const values = [
        userId,
        street.trim(),
        city.trim(),
        state.trim(),
        postal_code.trim(),
        number ? number.trim() : null,
        complement ? complement.trim() : null
      ];

      const result = await pool.query(query, values);
      return result.rows[0];

    } catch (error) {
      console.error('Erro ao criar endereço:', error.message);
      throw error;
    }
  }

  /**
   * Busca todos os endereços de um usuário
   * @param {string} userId - UUID do usuário
   * @returns {Array} Lista de endereços do usuário
   */
  async getUserAddresses(userId) {
    try {
      if (!userId || !this.isValidUUID(userId)) {
        throw new Error('ID de usuário inválido');
      }

      const query = `
        SELECT id, user_id, street, city, state, postal_code, number, complement, created_at
        FROM addresses
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;

    } catch (error) {
      console.error('Erro ao buscar endereços do usuário:', error.message);
      throw error;
    }
  }

  /**
   * Busca um endereço específico por ID
   * @param {string} addressId - UUID do endereço
   * @param {string} userId - UUID do usuário (para verificar propriedade)
   * @param {boolean} isAdmin - Se é admin
   * @returns {Object|null} Endereço ou null se não encontrado
   */
  async getAddressById(addressId, userId = null, isAdmin = false) {
    try {
      if (!addressId || !this.isValidUUID(addressId)) {
        throw new Error('ID de endereço inválido');
      }

      let query = `
        SELECT a.id, a.user_id, a.street, a.city, a.state, a.postal_code, 
               a.number, a.complement, a.created_at,
               u.email as user_email
        FROM addresses a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = $1
      `;

      let queryParams = [addressId];

      // Se não for admin, verificar se pertence ao usuário
      if (!isAdmin && userId) {
        if (!this.isValidUUID(userId)) {
          throw new Error('ID de usuário inválido');
        }
        query += ' AND a.user_id = $2';
        queryParams.push(userId);
      }

      const result = await pool.query(query, queryParams);
      return result.rows[0] || null;

    } catch (error) {
      console.error('Erro ao buscar endereço por ID:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza um endereço
   * @param {string} addressId - UUID do endereço
   * @param {string} userId - UUID do usuário
   * @param {Object} addressData - Novos dados do endereço
   * @param {boolean} isAdmin - Se é admin
   * @returns {Object} Endereço atualizado
   */
  async updateAddress(addressId, userId, addressData, isAdmin = false) {
    try {
      // Validações
      if (!addressId || !this.isValidUUID(addressId)) {
        throw new Error('ID de endereço inválido');
      }

      if (!isAdmin && (!userId || !this.isValidUUID(userId))) {
        throw new Error('ID de usuário inválido');
      }

      // Verificar se o endereço existe e pertence ao usuário
      const existingAddress = await this.getAddressById(addressId, userId, isAdmin);
      if (!existingAddress) {
        throw new Error('Endereço não encontrado');
      }

      const { street, city, state, postal_code, number, complement } = addressData;

      // Validações obrigatórias
      if (street !== undefined && (!street || street.trim().length === 0)) {
        throw new Error('Rua é obrigatória');
      }

      if (city !== undefined && (!city || city.trim().length === 0)) {
        throw new Error('Cidade é obrigatória');
      }

      if (state !== undefined && (!state || state.trim().length === 0)) {
        throw new Error('Estado é obrigatório');
      }

      if (postal_code !== undefined && (!postal_code || postal_code.trim().length === 0)) {
        throw new Error('CEP é obrigatório');
      }

      // Validação de tamanhos
      if (street && street.trim().length > 255) {
        throw new Error('Rua deve ter no máximo 255 caracteres');
      }

      if (city && city.trim().length > 100) {
        throw new Error('Cidade deve ter no máximo 100 caracteres');
      }

      if (state && state.trim().length > 50) {
        throw new Error('Estado deve ter no máximo 50 caracteres');
      }

      if (postal_code && postal_code.trim().length > 20) {
        throw new Error('CEP deve ter no máximo 20 caracteres');
      }

      if (number && number.trim().length > 20) {
        throw new Error('Número deve ter no máximo 20 caracteres');
      }

      if (complement && complement.trim().length > 255) {
        throw new Error('Complemento deve ter no máximo 255 caracteres');
      }

      // Construir query de atualização dinamicamente
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      if (street !== undefined) {
        updateFields.push(`street = $${paramCounter++}`);
        updateValues.push(street.trim());
      }

      if (city !== undefined) {
        updateFields.push(`city = $${paramCounter++}`);
        updateValues.push(city.trim());
      }

      if (state !== undefined) {
        updateFields.push(`state = $${paramCounter++}`);
        updateValues.push(state.trim());
      }

      if (postal_code !== undefined) {
        updateFields.push(`postal_code = $${paramCounter++}`);
        updateValues.push(postal_code.trim());
      }

      if (number !== undefined) {
        updateFields.push(`number = $${paramCounter++}`);
        updateValues.push(number ? number.trim() : null);
      }

      if (complement !== undefined) {
        updateFields.push(`complement = $${paramCounter++}`);
        updateValues.push(complement ? complement.trim() : null);
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhum campo para atualizar foi fornecido');
      }

      const query = `
        UPDATE addresses 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, user_id, street, city, state, postal_code, number, complement, created_at
      `;

      updateValues.push(addressId);

      const result = await pool.query(query, updateValues);
      return result.rows[0];

    } catch (error) {
      console.error('Erro ao atualizar endereço:', error.message);
      throw error;
    }
  }

  /**
   * Remove um endereço
   * @param {string} addressId - UUID do endereço
   * @param {string} userId - UUID do usuário
   * @param {boolean} isAdmin - Se é admin
   * @returns {boolean} True se removido com sucesso
   */
  async deleteAddress(addressId, userId, isAdmin = false) {
    try {
      // Validações
      if (!addressId || !this.isValidUUID(addressId)) {
        throw new Error('ID de endereço inválido');
      }

      if (!isAdmin && (!userId || !this.isValidUUID(userId))) {
        throw new Error('ID de usuário inválido');
      }

      // Verificar se o endereço existe e pertence ao usuário
      const existingAddress = await this.getAddressById(addressId, userId, isAdmin);
      if (!existingAddress) {
        throw new Error('Endereço não encontrado');
      }

      const query = 'DELETE FROM addresses WHERE id = $1';
      const result = await pool.query(query, [addressId]);

      return result.rowCount > 0;

    } catch (error) {
      console.error('Erro ao deletar endereço:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos os endereços (apenas para admins)
   * @param {Object} options - Opções de paginação e filtro
   * @returns {Object} Lista paginada de endereços
   */
  async listAllAddresses(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        city = null,
        state = null,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      // Validar parâmetros
      const validSortFields = ['created_at', 'city', 'state', 'street'];
      const validSortOrders = ['ASC', 'DESC'];

      if (!validSortFields.includes(sortBy)) {
        throw new Error('Campo de ordenação inválido');
      }

      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new Error('Ordem de classificação inválida');
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construir WHERE clause
      const whereConditions = [];
      const queryParams = [];
      let paramCounter = 1;

      if (city) {
        whereConditions.push(`a.city ILIKE $${paramCounter++}`);
        queryParams.push(`%${city}%`);
      }

      if (state) {
        whereConditions.push(`a.state ILIKE $${paramCounter++}`);
        queryParams.push(`%${state}%`);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Query principal
      const query = `
        SELECT a.id, a.user_id, a.street, a.city, a.state, a.postal_code, 
               a.number, a.complement, a.created_at,
               u.email as user_email
        FROM addresses a
        JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;

      queryParams.push(parseInt(limit), offset);
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM addresses a
        JOIN users u ON a.user_id = u.id
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remove LIMIT e OFFSET

      // Executar as queries
      const [addressesResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const addresses = addressesResult.rows;
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      return {
        addresses,
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
      console.error('Erro ao listar todos os endereços:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de endereços (para admins)
   * @returns {Object} Estatísticas dos endereços
   */
  async getAddressStatistics() {
    try {
      const queries = {
        // Total de endereços
        totalAddresses: `
          SELECT COUNT(*) as total_addresses
          FROM addresses
        `,
        // Endereços por estado
        byState: `
          SELECT state, COUNT(*) as count
          FROM addresses
          GROUP BY state
          ORDER BY count DESC
          LIMIT 10
        `,
        // Endereços por cidade
        byCity: `
          SELECT city, state, COUNT(*) as count
          FROM addresses
          GROUP BY city, state
          ORDER BY count DESC
          LIMIT 10
        `,
        // Usuários com mais endereços
        usersWithMostAddresses: `
          SELECT u.email, COUNT(a.id) as address_count
          FROM users u
          JOIN addresses a ON u.id = a.user_id
          GROUP BY u.id, u.email
          ORDER BY address_count DESC
          LIMIT 10
        `
      };

      const [totalResult, stateResult, cityResult, usersResult] = await Promise.all([
        pool.query(queries.totalAddresses),
        pool.query(queries.byState),
        pool.query(queries.byCity),
        pool.query(queries.usersWithMostAddresses)
      ]);

      return {
        totalAddresses: parseInt(totalResult.rows[0].total_addresses),
        byState: stateResult.rows,
        byCity: cityResult.rows,
        usersWithMostAddresses: usersResult.rows
      };
      
    } catch (error) {
      console.error('Erro ao obter estatísticas de endereços:', error.message);
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

module.exports = AddressService;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/config');

/**
 * Service responsável pela lógica de autenticação
 */
class AuthService {
  
  /**
   * Cria um novo usuário no sistema
   * @param {string} email - Email do usuário
   * @param {string} password - Senha em texto plano
   * @param {string} name - Nome do usuário
   * @param {string} phone - Telefone do usuário
   * @param {string} role - Função do usuário (cliente ou admin)
   * @returns {Object} Dados do usuário criado (sem a senha)
   */
  async createUser(email, password, name, phone, role = 'cliente') {
  try {
    // Verifica se o email já existe
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado no sistema');
    }

    // Gera hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insere o usuário no banco
    const query = `
      INSERT INTO users (email, password, name, phone, role) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, name, phone, role, created_at
    `;
    const result = await pool.query(query, [email, hashedPassword, name, phone, role]);
    const user = result.rows[0];

    // Gera o token JWT para o usuário recém-criado
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Retorna os dados do usuário + token
    return {
      user,
      token
    };
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    throw error;
  }
}


  /**
   * Autentica um usuário e retorna JWT
   * @param {string} email - Email do usuário
   * @param {string} password - Senha em texto plano
   * @returns {Object} Token JWT e dados do usuário
   */
  async loginUser(email, password) {
    try {
      // Busca o usuário pelo email
      const user = await this.findUserByEmail(email, true); // true = incluir senha
      
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verifica a senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Gera o token JWT
      const token = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Remove a senha do objeto retornado
      const { password: _, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword
      };

    } catch (error) {
      console.error('Erro ao fazer login:', error.message);
      throw error;
    }
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @param {boolean} includePassword - Se deve incluir a senha no resultado
   * @returns {Object|null} Dados do usuário ou null se não encontrado
   */
  async findUserByEmail(email, includePassword = false) {
    try {
      const fields = includePassword 
        ? 'id, email, password, name, phone, role, created_at, updated_at'
        : 'id, email, name, phone, role, created_at, updated_at';
        
      const query = `SELECT ${fields} FROM users WHERE email = $1`;
      const result = await pool.query(query, [email]);
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      throw error;
    }
  }

  /**
   * Busca usuário por ID (UUID)
   * @param {string} id - UUID do usuário
   * @returns {Object|null} Dados do usuário ou null se não encontrado
   */
  async findUserById(id) {
    try {
      // Validar se é um UUID válido
      if (!this.isValidUUID(id)) {
        throw new Error('ID de usuário inválido');
      }

      const query = `
        SELECT id, email, name, phone, role, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows[0]) {
        const user = result.rows[0];
        return {
          ...user,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          created_at: undefined,
          updated_at: undefined
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error.message);
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

  /**
   * Gera token JWT
   * @param {Object} payload - Dados para incluir no token
   * @returns {string} Token JWT
   */
  generateToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '24h', // Token expira em 24 horas
        issuer: 'api-auth-jwt' // Identificador da aplicação
      }
    );
  }

  /**
   * Verifica se um token JWT é válido
   * @param {string} token - Token JWT
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  /**
   * Lista todos os clientes com nome e telefone
   * @returns {Promise<Array>} Lista de clientes
   */
  async listClientsBasicInfo() {
    try {
      const query = `
        SELECT name, phone 
        FROM users 
        WHERE role = 'cliente'
        ORDER BY name ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar clientes:', error.message);
      throw error;
    }
  }
}

module.exports = AuthService;
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
   * @param {string} role - Função do usuário (cliente ou admin)
   * @returns {Object} Dados do usuário criado (sem a senha)
   */
  async createUser(email, password, role = 'cliente') {
    try {
      // Verifica se o email já existe
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('Email já cadastrado no sistema');
      }

      // Gera hash da senha (salt rounds = 12 para boa segurança)
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insere o usuário no banco
      const query = `
        INSERT INTO users (email, password, role) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, role, created_at
      `;
      
      const result = await pool.query(query, [email, hashedPassword, role]);
      return result.rows[0];
      
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
        ? 'id, email, password, role, created_at, updated_at'
        : 'id, email, role, created_at, updated_at';
        
      const query = `SELECT ${fields} FROM users WHERE email = $1`;
      const result = await pool.query(query, [email]);
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      throw error;
    }
  }

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Object|null} Dados do usuário ou null se não encontrado
   */
  async findUserById(id) {
    try {
      const query = `
        SELECT id, email, role, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error.message);
      throw error;
    }
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
}

module.exports = AuthService;
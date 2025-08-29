const AuthService = require('../services/authService');
const authService = new AuthService();

/**
 * Controller responsável pelos endpoints de autenticação
 */
class AuthController {

  /**
   * POST /auth/register
   * Registra um novo usuário no sistema
   */
  async register(req, res) {
    try {
      const { email, password, role } = req.body;

      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Validação do formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validação da senha
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      // Validação do role (se fornecido)
      const allowedRoles = ['cliente', 'admin'];
      const userRole = role || 'cliente';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de usuário inválido. Use: cliente ou admin'
        });
      }

      // Cria o usuário
      const { user, token } = await authService.createUser(email, password, userRole);

res.status(201).json({
  success: true,
  message: 'Usuário criado com sucesso',
  data: {
    token,
    user
  }
});

    } catch (error) {
      console.error('Erro no registro:', error.message);
      
      // Se for erro de email duplicado
      if (error.message.includes('já cadastrado')) {
        return res.status(409).json({
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
   * POST /auth/login
   * Faz login do usuário e retorna JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }

      // Autentica o usuário
      const result = await authService.loginUser(email, password);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token: result.token,
          user: result.user
        }
      });

    } catch (error) {
      console.error('Erro no login:', error.message);
      
      // Se for erro de credenciais inválidas
      if (error.message.includes('Credenciais inválidas')) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /auth/profile
   * Retorna dados do usuário autenticado
   */
  async getProfile(req, res) {
    try {
      // req.user já vem do middleware de autenticação
      const user = await authService.findUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Erro ao obter perfil:', error.message);
      
      // Se for erro de UUID inválido
      if (error.message.includes('ID de usuário inválido')) {
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
   * POST /auth/verify-token
   * Verifica se um token JWT é válido
   */
  async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório'
        });
      }

      const decoded = authService.verifyToken(token);
      
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          decoded
        }
      });

    } catch (error) {
      console.error('Erro na verificação do token:', error.message);
      
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
  }
}

module.exports = new AuthController();
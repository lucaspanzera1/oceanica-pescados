const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middlewares/auth');

const router = express.Router();

/**
 * Rotas de autenticação
 */

// POST /auth/register - Registrar novo usuário
router.post('/register', authController.register);

// POST /auth/login - Fazer login
router.post('/login', authController.login);

// POST /auth/verify-token - Verificar se token é válido
router.post('/verify-token', authController.verifyToken);

// GET /auth/profile - Obter perfil do usuário autenticado
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * Rotas protegidas - exemplos de uso dos middlewares
 */

// GET /auth/admin - Rota apenas para administradores
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Acesso de administrador concedido',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

// GET /auth/protected - Rota protegida por JWT (qualquer usuário autenticado)
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Rota protegida acessada com sucesso',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

// GET /auth/user/:id - Buscar usuário por ID (apenas próprio usuário ou admin)
router.get('/user/:id', authenticateToken, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const authService = new (require('../services/authService'))();
    const user = await authService.findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuário encontrado com sucesso',
      data: { user }
    });
  } catch (error) {
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
});

module.exports = router;
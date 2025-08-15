const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

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

module.exports = router;
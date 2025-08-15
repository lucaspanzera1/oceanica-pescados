const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona os dados do usuário ao req.user
 */
const authenticateToken = (req, res, next) => {
  // Pega o token do header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acesso requerido' 
    });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adiciona os dados do usuário ao request
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 * Deve ser usado após o authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuário não autenticado' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário pode acessar o próprio perfil ou é admin
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuário não autenticado' 
    });
  }

  // Admin pode acessar qualquer perfil, usuário só pode acessar o próprio
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Você só pode acessar seus próprios dados.' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin
};
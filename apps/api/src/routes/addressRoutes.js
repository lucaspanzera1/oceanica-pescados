const express = require('express');
const addressController = require('../controllers/addressController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

/**
 * Função auxiliar para fazer bind de todos os métodos do controller
 * Isso garante que o `this` dentro dos métodos aponte corretamente para a instância
 */
const bindController = (controller) => {
  const boundController = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
    .filter(prop => typeof controller[prop] === 'function' && prop !== 'constructor')
    .forEach(method => {
      boundController[method] = controller[method].bind(controller);
    });
  return boundController;
};

const controller = bindController(addressController);

/**
 * Rotas protegidas - requerem autenticação
 */

// Criar novo endereço
router.post('/', 
  authenticateToken, 
  controller.createAddress
);

// Listar endereços do usuário (ou todos se admin)
router.get('/', 
  authenticateToken, 
  controller.getAddresses
);

// Listar apenas meus endereços (rota específica para usuários comuns)
router.get('/my', 
  authenticateToken, 
  controller.getMyAddresses
);

// Buscar endereço por ID (próprio endereço ou admin)
router.get('/:id', 
  authenticateToken, 
  controller.getAddressById
);

// Atualizar endereço (próprio endereço ou admin)
router.put('/:id', 
  authenticateToken, 
  controller.updateAddress
);

// Remover endereço (próprio endereço ou admin)
router.delete('/:id', 
  authenticateToken, 
  controller.deleteAddress
);

/**
 * Rotas administrativas - requerem admin
 */

// Estatísticas de endereços (apenas admins)
router.get('/statistics', 
  authenticateToken, 
  requireAdmin, 
  controller.getStatistics
);

module.exports = router;
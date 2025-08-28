const express = require('express');
const orderController = require('../controllers/orderController');
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

const controller = bindController(orderController);

/**
 * Rotas protegidas - usuários autenticados
 */

// Criar pedido a partir do carrinho
router.post('/', 
  authenticateToken, 
  controller.createOrder
);

// Listar meus pedidos (usuário comum)
router.get('/my', 
  authenticateToken, 
  controller.getMyOrders
);

// Obter estatísticas de pedidos (admin)
router.get('/statistics', 
  authenticateToken, 
  requireAdmin, 
  controller.getStatistics
);

// Buscar pedido por ID (próprio pedido ou admin)
router.get('/:id', 
  authenticateToken, 
  controller.getOrderById
);

// Cancelar pedido (próprio pedido ou admin)
router.patch('/:id/cancel', 
  authenticateToken, 
  controller.cancelOrder
);

/**
 * Rotas administrativas - apenas para administradores
 */

// Listar todos os pedidos (admin)
router.get('/', 
  authenticateToken, 
  requireAdmin,
  controller.listOrders
);

// Atualizar status do pedido (admin)
router.patch('/:id/status', 
  authenticateToken, 
  requireAdmin, 
  controller.updateOrderStatus
);

module.exports = router;
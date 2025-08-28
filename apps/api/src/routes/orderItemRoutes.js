const express = require('express');
const orderItemController = require('../controllers/orderItemController');
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

const controller = bindController(orderItemController);

/**
 * Rotas protegidas - requerem autenticação
 */

// Criar itens de pedido (usuário autenticado pode criar para seus próprios pedidos)
router.post('/', 
  authenticateToken, 
  controller.createOrderItems
);

// Buscar itens de um pedido específico
router.get('/order/:orderId', 
  authenticateToken, 
  controller.getOrderItems
);

// Buscar item específico por ID
router.get('/:id', 
  authenticateToken, 
  controller.getOrderItemById
);

// Atualizar quantidade de um item
router.put('/:id/quantity', 
  authenticateToken, 
  controller.updateOrderItemQuantity
);

// Remover item específico
router.delete('/:id', 
  authenticateToken, 
  controller.deleteOrderItem
);

// Remover todos os itens de um pedido
router.delete('/order/:orderId', 
  authenticateToken, 
  controller.deleteOrderItems
);

// Calcular totais de um pedido
router.get('/order/:orderId/total', 
  authenticateToken, 
  controller.calculateOrderTotal
);

/**
 * Rotas administrativas - requerem admin
 */

// Listar itens por produto (para análises administrativas)
router.get('/product/:productId', 
  authenticateToken, 
  requireAdmin, 
  controller.getOrderItemsByProduct
);

// Estatísticas de vendas (somente admins)
router.get('/statistics/sales', 
  authenticateToken, 
  requireAdmin, 
  controller.getProductSalesStats
);

module.exports = router;
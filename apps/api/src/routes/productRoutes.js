const express = require('express');
const productController = require('../controllers/productController');
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

const controller = bindController(productController);

/**
 * Rotas de produtos (públicas)
 */
router.get('/', controller.listProducts);       // Lista produtos
router.get('/:id', controller.getProductById); // Busca produto por ID

/**
 * Rotas protegidas - apenas para administradores
 */
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  controller.createProduct
);

router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  controller.updateProduct
);

router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  controller.deleteProduct
);

router.patch('/:id/stock', 
  authenticateToken, 
  requireAdmin, 
  controller.updateStock
);

module.exports = router;

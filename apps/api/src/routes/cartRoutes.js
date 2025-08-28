const express = require('express');
const CartController = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Criar instância do controller
const cartController = new CartController();

/**
 * Rotas do carrinho - todas requerem autenticação
 * Usando bind para manter o contexto do controller
 */

// GET /cart/count - Contar itens no carrinho (deve vir antes de /cart/:productId)
router.get('/count', 
  authenticateToken, 
  cartController.getCartItemsCount.bind(cartController)
);

// GET /cart - Obter carrinho completo do usuário
router.get('/', 
  authenticateToken, 
  cartController.getCart.bind(cartController)
);

// POST /cart - Adicionar item ao carrinho
router.post('/', 
  authenticateToken, 
  cartController.addItemToCart.bind(cartController)
);

// PUT /cart/:productId - Atualizar quantidade de um item
router.put('/:productId', 
  authenticateToken, 
  cartController.updateCartItem.bind(cartController)
);

// DELETE /cart/:productId - Remover item específico do carrinho
router.delete('/:productId', 
  authenticateToken, 
  cartController.removeCartItem.bind(cartController)
);

// DELETE /cart - Limpar carrinho completo
router.delete('/', 
  authenticateToken, 
  cartController.clearCart.bind(cartController)
);

module.exports = router;
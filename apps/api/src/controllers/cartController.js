const CartService = require('../services/cartService');
const { logError } = require('../config/logger');

/**
 * Controller responsável pelos endpoints do carrinho de compras
 */
class CartController {
  constructor() {
    this.cartService = new CartService();
  }

  /**
   * POST /cart
   * Adiciona um item ao carrinho
   */
  async addItemToCart(req, res) {
    try {
      const userId = req.user.id; // Vem do middleware de autenticação
      const { productId, quantity = 1 } = req.body;

      // Validações básicas
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'ID do produto é obrigatório'
        });
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade deve ser um número válido maior que zero'
        });
      }

      if (numericQuantity > 100) { // Limite razoável
        return res.status(400).json({
          success: false,
          message: 'Quantidade máxima por adição é 100 unidades'
        });
      }

      const cartItem = await this.cartService.addItemToCart(userId, productId, numericQuantity);

      res.status(201).json({
        success: true,
        message: 'Item adicionado ao carrinho com sucesso',
        data: { cartItem }
      });

    } catch (error) {
      logError(error, req);

      // Tratamento de erros específicos
      if (error.message.includes('não encontrado') ||
          error.message.includes('inválido') ||
          error.message.includes('Estoque insuficiente') ||
          error.message.includes('deve ser')) {
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
   * GET /cart
   * Busca todos os itens do carrinho do usuário autenticado
   */
  async getCart(req, res) {
    try {
      const userId = req.user.id;

      const cart = await this.cartService.getCartByUserId(userId);

      res.json({
        success: true,
        message: 'Carrinho obtido com sucesso',
        data: { cart }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido')) {
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
   * PUT /cart/:productId
   * Atualiza a quantidade de um item no carrinho
   */
  async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { quantity } = req.body;

      // Validações
      if (!quantity) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade deve ser um número válido maior que zero'
        });
      }

      if (numericQuantity > 100) { // Limite razoável
        return res.status(400).json({
          success: false,
          message: 'Quantidade máxima é 100 unidades'
        });
      }

      const cartItem = await this.cartService.updateCartItemQuantity(userId, productId, numericQuantity);

      res.json({
        success: true,
        message: 'Quantidade do item atualizada com sucesso',
        data: { cartItem }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('inválido') ||
          error.message.includes('Estoque insuficiente') ||
          error.message.includes('deve ser')) {
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
   * DELETE /cart/:productId
   * Remove um item específico do carrinho
   */
  async removeCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const removed = await this.cartService.removeItemFromCart(userId, productId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado no carrinho'
        });
      }

      res.json({
        success: true,
        message: 'Item removido do carrinho com sucesso'
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido')) {
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
   * DELETE /cart
   * Limpa todos os itens do carrinho
   */
  async clearCart(req, res) {
    try {
      const userId = req.user.id;

      await this.cartService.clearCart(userId);

      res.json({
        success: true,
        message: 'Carrinho limpo com sucesso'
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido')) {
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
   * GET /cart/count
   * Retorna a contagem de itens no carrinho
   */
  async getCartItemsCount(req, res) {
    try {
      const userId = req.user.id;

      const counts = await this.cartService.getCartItemsCount(userId);

      res.json({
        success: true,
        message: 'Contagem do carrinho obtida com sucesso',
        data: { counts }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido')) {
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
}

module.exports = CartController;
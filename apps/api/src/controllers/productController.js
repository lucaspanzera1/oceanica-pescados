const ProductService = require('../services/productService');
const { logError } = require('../config/logger');

/**
 * Controller responsável pelos endpoints de produtos
 */
class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Valida se uma URL é válida
   * @param {string} url - URL para validar
   * @returns {boolean} True se for uma URL válida
   */
  validateImageUrl(url) {
    if (!url || url.trim().length === 0) {
      return true; // URLs vazias são aceitas (null)
    }
    
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * POST /products
   * Cria um novo produto (apenas admins)
   */
  async createProduct(req, res) {
    try {
      const { name, description, price, stock, image_url, image_url1 } = req.body;

      // Validações básicas
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do produto é obrigatório'
        });
      }

      if (!price) {
        return res.status(400).json({
          success: false,
          message: 'Preço do produto é obrigatório'
        });
      }

      // Validação do preço
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Preço deve ser um número válido maior que zero'
        });
      }

      // Validação do estoque
      let numericStock = 0;
      if (stock !== undefined) {
        numericStock = parseInt(stock);
        if (isNaN(numericStock) || numericStock < 0) {
          return res.status(400).json({
            success: false,
            message: 'Estoque deve ser um número válido maior ou igual a zero'
          });
        }
      }

      // Validação da primeira URL da imagem
      if (image_url && !this.validateImageUrl(image_url)) {
        return res.status(400).json({
          success: false,
          message: 'URL da primeira imagem inválida'
        });
      }

      // Validação da segunda URL da imagem
      if (image_url1 && !this.validateImageUrl(image_url1)) {
        return res.status(400).json({
          success: false,
          message: 'URL da segunda imagem inválida'
        });
      }

      // Cria o produto
      const product = await this.productService.createProduct({
        name: name.trim(),
        description: description?.trim(),
        price: numericPrice,
        stock: numericStock,
        image_url: image_url?.trim(),
        image_url1: image_url1?.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Produto criado com sucesso',
        data: { product }
      });

    } catch (error) {
      logError(error, req);

      // Tratamento de erros específicos
      if (error.message.includes('obrigatório') || 
          error.message.includes('inválido') || 
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
   * GET /products/:id
   * Busca produto por ID
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await this.productService.findProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Produto encontrado com sucesso',
        data: { product }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('ID de produto inválido')) {
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
   * GET /products
   * Lista produtos com paginação e filtros
   */
  async listProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      // Validações
      const numericPage = parseInt(page);
      const numericLimit = parseInt(limit);

      if (isNaN(numericPage) || numericPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Página deve ser um número válido maior que zero'
        });
      }

      if (isNaN(numericLimit) || numericLimit < 1 || numericLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limite deve ser um número entre 1 e 100'
        });
      }

      const result = await this.productService.listProducts({
        page: numericPage,
        limit: numericLimit,
        search: search.toString(),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        message: 'Produtos listados com sucesso',
        data: result
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('inválido') || error.message.includes('inválida')) {
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
   * PUT /products/:id
   * Atualiza produto por ID (apenas admins)
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, stock, image_url, image_url1 } = req.body;

      // Validações dos dados fornecidos
      const updateData = {};

      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Nome do produto não pode estar vazio'
          });
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim();
      }

      if (price !== undefined) {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Preço deve ser um número válido maior que zero'
          });
        }
        updateData.price = numericPrice;
      }

      if (stock !== undefined) {
        const numericStock = parseInt(stock);
        if (isNaN(numericStock) || numericStock < 0) {
          return res.status(400).json({
            success: false,
            message: 'Estoque deve ser um número válido maior ou igual a zero'
          });
        }
        updateData.stock = numericStock;
      }

      if (image_url !== undefined) {
        if (image_url && image_url.trim().length > 0) {
          if (!this.validateImageUrl(image_url)) {
            return res.status(400).json({
              success: false,
              message: 'URL da primeira imagem inválida'
            });
          }
          updateData.image_url = image_url.trim();
        } else {
          updateData.image_url = null;
        }
      }

      if (image_url1 !== undefined) {
        if (image_url1 && image_url1.trim().length > 0) {
          if (!this.validateImageUrl(image_url1)) {
            return res.status(400).json({
              success: false,
              message: 'URL da segunda imagem inválida'
            });
          }
          updateData.image_url1 = image_url1.trim();
        } else {
          updateData.image_url1 = null;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo válido fornecido para atualização'
        });
      }

      const product = await this.productService.updateProduct(id, updateData);

      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: { product }
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
          error.message.includes('obrigatório') || 
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
   * DELETE /products/:id
   * Remove produto por ID (apenas admins)
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const deleted = await this.productService.deleteProduct(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Produto removido com sucesso'
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('ID de produto inválido')) {
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
   * PATCH /products/:id/stock
   * Atualiza estoque do produto (apenas admins)
   */
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined || quantity === null) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity)) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade deve ser um número válido'
        });
      }

      const product = await this.productService.updateStock(id, numericQuantity);

      res.json({
        success: true,
        message: 'Estoque atualizado com sucesso',
        data: { product }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('estoque negativo')) {
        return res.status(400).json({
          success: false,
          message: 'Operação resultaria em estoque negativo'
        });
      }

      if (error.message.includes('inválido') || error.message.includes('deve ser')) {
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

module.exports = new ProductController();
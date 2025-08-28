const AddressService = require('../services/addressService');
const { logError } = require('../config/logger');

/**
 * Controller responsável pelos endpoints de endereços
 */
class AddressController {
  constructor() {
    this.addressService = new AddressService();
  }

  /**
   * POST /addresses
   * Cria um novo endereço para o usuário
   */
  async createAddress(req, res) {
    try {
      const userId = req.user.id;
      const addressData = req.body;

      const address = await this.addressService.createAddress(userId, addressData);

      res.status(201).json({
        success: true,
        message: 'Endereço criado com sucesso',
        data: { address }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('obrigatória') || 
          error.message.includes('obrigatório') ||
          error.message.includes('inválido') ||
          error.message.includes('deve ter') ||
          error.message.includes('não encontrado')) {
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
   * GET /addresses
   * Lista endereços do usuário ou todos (se admin)
   */
  async getAddresses(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (isAdmin) {
        // Admin pode ver todos os endereços
        const {
          page = 1,
          limit = 20,
          city,
          state,
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

        const result = await this.addressService.listAllAddresses({
          page: numericPage,
          limit: numericLimit,
          city,
          state,
          sortBy,
          sortOrder
        });

        res.json({
          success: true,
          message: 'Endereços listados com sucesso',
          data: result
        });

      } else {
        // Usuário comum vê apenas seus endereços
        const addresses = await this.addressService.getUserAddresses(userId);

        res.json({
          success: true,
          message: 'Seus endereços listados com sucesso',
          data: { addresses }
        });
      }

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
   * GET /addresses/my
   * Lista apenas os endereços do usuário logado
   */
  async getMyAddresses(req, res) {
    try {
      const userId = req.user.id;

      const addresses = await this.addressService.getUserAddresses(userId);

      res.json({
        success: true,
        message: 'Seus endereços listados com sucesso',
        data: { addresses }
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
   * GET /addresses/:id
   * Busca endereço por ID (próprio endereço ou admin)
   */
  async getAddressById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const address = await this.addressService.getAddressById(id, userId, isAdmin);

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Endereço não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Endereço encontrado com sucesso',
        data: { address }
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
   * PUT /addresses/:id
   * Atualiza um endereço
   */
  async updateAddress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';
      const addressData = req.body;

      const updatedAddress = await this.addressService.updateAddress(id, userId, addressData, isAdmin);

      res.json({
        success: true,
        message: 'Endereço atualizado com sucesso',
        data: { address: updatedAddress }
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('obrigatória') || 
          error.message.includes('obrigatório') ||
          error.message.includes('inválido') ||
          error.message.includes('deve ter') ||
          error.message.includes('Nenhum campo')) {
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
   * DELETE /addresses/:id
   * Remove um endereço
   */
  async deleteAddress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const deleted = await this.addressService.deleteAddress(id, userId, isAdmin);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Endereço não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Endereço removido com sucesso'
      });

    } catch (error) {
      logError(error, req);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

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
   * GET /addresses/statistics
   * Obtém estatísticas de endereços (apenas admins)
   */
  async getStatistics(req, res) {
    try {
      const statistics = await this.addressService.getAddressStatistics();

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: { statistics }
      });

    } catch (error) {
      logError(error, req);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AddressController();
const express = require('express');
const path = require('path');
const multer = require('multer');
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
 * Configuração do multer para salvar arquivos localmente
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
  upload.any(), // Aceita qualquer campo de arquivo
  (req, res, next) => {
    // Monta as URLs locais das imagens
    if (req.files && req.files.length > 0) {
      // Mapeia os arquivos recebidos para os campos esperados
      const fileMap = {};
      req.files.forEach(file => {
        fileMap[file.fieldname] = file;
      });
      
      // Mapeia para os nomes esperados pelo controller
      if (fileMap['image1'] || fileMap['image_url']) {
        const file = fileMap['image1'] || fileMap['image_url'];
        req.body.image_url = `/uploads/products/${file.filename}`;
      }
      
      if (fileMap['image2'] || fileMap['image_url1']) {
        const file = fileMap['image2'] || fileMap['image_url1'];
        req.body.image_url1 = `/uploads/products/${file.filename}`;
      }
      
      // Log para debug - remova depois de funcionar
      console.log('Arquivos recebidos:', req.files.map(f => f.fieldname));
      console.log('URLs montadas:', { image_url: req.body.image_url, image_url1: req.body.image_url1 });
    }
    next();
  },
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
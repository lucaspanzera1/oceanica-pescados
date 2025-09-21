const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuração da conexão com PostgreSQL
 * Utiliza pool de conexões para melhor performance
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // Configurações do pool
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para criar conexão
});

/**
 * Testa a conexão com o banco de dados
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    client.release();
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
    process.exit(1);
  }
};

/**
 * Fecha o pool de conexões
 */
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Pool de conexões PostgreSQL fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar pool de conexões:', error.message);
    throw error;
  }
};

/**
 * Cria as tabelas necessárias se não existirem
 * Suporta tanto uuid-ossp (antigo) quanto pgcrypto (moderno)
 */
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    let uuidFunction = 'uuid_generate_v4()';

    // Tenta habilitar uuid-ossp primeiro
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      console.log('ℹ️ Extensão "uuid-ossp" habilitada');
    } catch (err) {
      console.warn('⚠️ Não foi possível habilitar "uuid-ossp", tentando "pgcrypto"...');
      await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      uuidFunction = 'gen_random_uuid()';
      console.log('ℹ️ Extensão "pgcrypto" habilitada');
    }

    // Criar tabela de usuários com UUID
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT ${uuidFunction},
        name VARCHAR(255) NOT NULL DEFAULT '',
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL DEFAULT '',
        role VARCHAR(50) DEFAULT 'cliente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
      
          // Criar tabela de usuários com UUID
    await client.query(`
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
    `);

    // Criar tabela de produtos com UUID
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT ${uuidFunction},
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL CHECK (price > 0),
        stock INT DEFAULT 0 CHECK (stock >= 0),
        image_url TEXT,
        image_url1 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de itens do carrinho
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT ${uuidFunction},
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    // Criar tabela de enderecos primeiro (porque orders precisa dela)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.addresses (
        id UUID PRIMARY KEY DEFAULT ${uuidFunction},
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        street VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        number VARCHAR(20),
        complement VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de pedidos
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT ${uuidFunction},
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'enviado', 'cancelado')),
        shipping_price NUMERIC(10,2) DEFAULT 0 CHECK (shipping_price >= 0),
        total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
        address_id UUID REFERENCES addresses(id),
        customer_id UUID REFERENCES public.customers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de itens dos pedidos
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(10,2) NOT NULL CHECK (price > 0),
        subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    
    // Índices da tabela users
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    // Índices da tabela products
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)
    `);

    // Índices da tabela cart_items
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at)
    `);

    // Índices da tabela orders
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status)
    `);

    // Índices da tabela order_items
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at)
    `);

    console.log('✅ Tabelas do banco de dados inicializadas!');
    console.log('  - Tabela users criada/verificada');
    console.log('  - Tabela products criada/verificada');
    console.log('  - Tabela cart_items criada/verificada');
    console.log('  - Tabela orders criada/verificada');
    console.log('  - Tabela order_items criada/verificada');
    console.log('  - Tabela address criada/verificada');
    console.log('  - Índices criados/verificados');
    console.log('  - Foreign keys e constraints aplicados');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  testConnection,
  closePool,
  initializeDatabase
};
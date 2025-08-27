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
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'cliente',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

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

    console.log('✅ Tabelas do banco de dados inicializadas!');
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
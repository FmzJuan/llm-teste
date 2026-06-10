require('dotenv').config();
const { Pool } = require('pg');

// Configura o pool de conexões utilizando as variáveis do arquivo .env
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

// Exporta um método de query centralizado
module.exports = {
  query: (text, params) => pool.query(text, params),
};
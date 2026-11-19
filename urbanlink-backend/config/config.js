const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const common = {
  username: process.env.DB_USER || 'urbanlink_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urbanlink',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: { charset: 'utf8mb4' },
  define: { underscored: true, freezeTableName: true }
};

module.exports = {
  development: common,
  test: { ...common, database: process.env.DB_TEST_NAME || 'urbanlink_test' },
  production: { ...common, logging: false }
};

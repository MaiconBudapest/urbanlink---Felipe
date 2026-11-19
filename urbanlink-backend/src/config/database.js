const { Sequelize } = require('sequelize');
// Importado explicitamente para a Vercel incluir o driver no pacote da função.
// Sem isso o Sequelize falha com "Please install mysql2 package manually".
const mysql2 = require('mysql2');
const env = require('./env');

const sequelize = new Sequelize(env.database.name, env.database.user, env.database.password, {
  host: env.database.host,
  port: env.database.port,
  dialect: 'mysql',
  dialectModule: mysql2,
  dialectOptions: env.database.ssl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {},
  logging: env.database.logging ? console.log : false,
  timezone: '+00:00',
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
});

module.exports = sequelize;

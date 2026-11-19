const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(100), allowNull: false },
  role: {
    type: DataTypes.ENUM('cliente', 'operador', 'administrador', 'entregador', 'ponto_entrega'),
    allowNull: false,
    defaultValue: 'cliente'
  },
  status: { type: DataTypes.ENUM('ativo', 'suspenso'), allowNull: false, defaultValue: 'ativo' },
  phone: { type: DataTypes.STRING(24), allowNull: true },
  documentCiphertext: { type: DataTypes.TEXT, allowNull: true },
  documentHash: { type: DataTypes.CHAR(64), allowNull: true, unique: true },
  tokenVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'users',
  underscored: true,
  paranoid: true,
  defaultScope: { attributes: { exclude: ['passwordHash', 'documentCiphertext', 'documentHash', 'tokenVersion', 'deletedAt'] } },
  scopes: { withSecrets: { attributes: { include: ['passwordHash', 'documentCiphertext', 'documentHash', 'tokenVersion'] } } },
  indexes: [{ fields: ['role', 'status'] }]
});

module.exports = User;

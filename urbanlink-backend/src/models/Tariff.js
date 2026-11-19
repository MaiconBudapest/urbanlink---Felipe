const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tariff = sequelize.define('Tariff', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  serviceType: { type: DataTypes.ENUM('local', 'national'), allowNull: false, unique: true },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  pricePerKg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  pricePerPackage: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BRL' },
  isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  updatedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'tariffs',
  underscored: true,
  indexes: [{ fields: ['is_active', 'service_type'] }]
});

module.exports = Tariff;

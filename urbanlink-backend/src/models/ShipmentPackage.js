const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentPackage = sequelize.define('ShipmentPackage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  shipmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  heightCm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  widthCm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  lengthCm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  weightKg: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
  description: { type: DataTypes.STRING(160), allowNull: true }
}, {
  tableName: 'shipment_packages',
  underscored: true,
  timestamps: false
});

module.exports = ShipmentPackage;

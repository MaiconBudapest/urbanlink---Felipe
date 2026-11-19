const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  trackingCode: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  assignedCourierId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  serviceType: { type: DataTypes.ENUM('local', 'national'), allowNull: false },
  status: {
    type: DataTypes.ENUM('recebido', 'preparando', 'coletado', 'em_transito', 'saiu_para_entrega', 'entregue', 'ocorrencia', 'cancelado'),
    allowNull: false,
    defaultValue: 'recebido'
  },
  originAddress: { type: DataTypes.STRING(300), allowNull: false },
  originZip: { type: DataTypes.STRING(9), allowNull: false },
  destinationAddress: { type: DataTypes.STRING(300), allowNull: false },
  destinationZip: { type: DataTypes.STRING(9), allowNull: false },
  totalWeight: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BRL' },
  isDemoRate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  estimatedDeliveryAt: { type: DataTypes.DATE, allowNull: true },
  deliveredAt: { type: DataTypes.DATE, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'shipments',
  underscored: true,
  indexes: [
    { fields: ['customer_id', 'created_at'] },
    { fields: ['status', 'created_at'] },
    { fields: ['assigned_courier_id', 'status'] }
  ]
});

module.exports = Shipment;

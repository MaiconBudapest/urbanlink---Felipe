const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentEvent = sequelize.define('ShipmentEvent', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  shipmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  actorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  status: {
    type: DataTypes.ENUM('recebido', 'preparando', 'coletado', 'em_transito', 'saiu_para_entrega', 'entregue', 'ocorrencia', 'cancelado'),
    allowNull: false
  },
  publicDescription: { type: DataTypes.STRING(240), allowNull: false },
  privateNote: { type: DataTypes.STRING(500), allowNull: true },
  location: { type: DataTypes.STRING(120), allowNull: true },
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'shipment_events',
  underscored: true,
  timestamps: false,
  indexes: [{ fields: ['shipment_id', 'occurred_at'] }]
});

module.exports = ShipmentEvent;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PartnerApplication = sequelize.define('PartnerApplication', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  kind: { type: DataTypes.ENUM('entregador', 'ponto_entrega'), allowNull: false },
  status: { type: DataTypes.ENUM('pendente', 'em_analise', 'aprovado', 'rejeitado'), allowNull: false, defaultValue: 'pendente' },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false },
  phone: { type: DataTypes.STRING(24), allowNull: false },
  businessName: { type: DataTypes.STRING(160), allowNull: true },
  documentCiphertext: { type: DataTypes.TEXT, allowNull: true },
  documentHash: { type: DataTypes.CHAR(64), allowNull: true },
  licenseCiphertext: { type: DataTypes.TEXT, allowNull: true },
  vehicle: { type: DataTypes.ENUM('bicicleta', 'moto', 'carro', 'van', 'outro'), allowNull: true },
  zip: { type: DataTypes.STRING(9), allowNull: false },
  state: { type: DataTypes.STRING(80), allowNull: false },
  hours: { type: DataTypes.STRING(120), allowNull: true },
  days: { type: DataTypes.JSON, allowNull: true },
  consentAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  consentedAt: { type: DataTypes.DATE, allowNull: true },
  internalNotes: { type: DataTypes.STRING(800), allowNull: true },
  reviewedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'partner_applications',
  underscored: true,
  indexes: [
    { fields: ['kind', 'status', 'created_at'] },
    { unique: true, fields: ['kind', 'document_hash'] }
  ]
});

module.exports = PartnerApplication;

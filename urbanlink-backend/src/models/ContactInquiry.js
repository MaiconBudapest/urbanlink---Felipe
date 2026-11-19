const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactInquiry = sequelize.define('ContactInquiry', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.ENUM('novo', 'em_atendimento', 'encerrado'), allowNull: false, defaultValue: 'novo' },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false },
  phone: { type: DataTypes.STRING(24), allowNull: false },
  company: { type: DataTypes.STRING(160), allowNull: false },
  monthlyVolume: { type: DataTypes.STRING(40), allowNull: true },
  website: { type: DataTypes.STRING(255), allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  internalNotes: { type: DataTypes.STRING(800), allowNull: true },
  reviewedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'contact_inquiries',
  underscored: true,
  indexes: [{ fields: ['status', 'created_at'] }]
});

module.exports = ContactInquiry;

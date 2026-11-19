'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('users', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(100), allowNull: false },
      role: { type: DataTypes.ENUM('cliente', 'operador', 'administrador', 'entregador', 'ponto_entrega'), allowNull: false, defaultValue: 'cliente' },
      status: { type: DataTypes.ENUM('ativo', 'suspenso'), allowNull: false, defaultValue: 'ativo' },
      phone: { type: DataTypes.STRING(24), allowNull: true },
      document_ciphertext: { type: DataTypes.TEXT, allowNull: true },
      document_hash: { type: DataTypes.CHAR(64), allowNull: true, unique: true },
      token_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });
    await queryInterface.addIndex('users', ['role', 'status'], { name: 'users_role_status_idx' });

    await queryInterface.createTable('tariffs', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      service_type: { type: DataTypes.ENUM('local', 'national'), allowNull: false, unique: true },
      base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      price_per_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      price_per_package: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BRL' },
      is_demo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      updated_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex('tariffs', ['is_active', 'service_type'], { name: 'tariffs_active_service_idx' });

    await queryInterface.createTable('partner_applications', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      kind: { type: DataTypes.ENUM('entregador', 'ponto_entrega'), allowNull: false },
      status: { type: DataTypes.ENUM('pendente', 'em_analise', 'aprovado', 'rejeitado'), allowNull: false, defaultValue: 'pendente' },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(190), allowNull: false },
      phone: { type: DataTypes.STRING(24), allowNull: false },
      business_name: { type: DataTypes.STRING(160), allowNull: true },
      document_ciphertext: { type: DataTypes.TEXT, allowNull: true },
      document_hash: { type: DataTypes.CHAR(64), allowNull: true },
      license_ciphertext: { type: DataTypes.TEXT, allowNull: true },
      vehicle: { type: DataTypes.ENUM('bicicleta', 'moto', 'carro', 'van', 'outro'), allowNull: true },
      zip: { type: DataTypes.STRING(9), allowNull: false },
      state: { type: DataTypes.STRING(80), allowNull: false },
      hours: { type: DataTypes.STRING(120), allowNull: true },
      days: { type: DataTypes.JSON, allowNull: true },
      consent_accepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      consented_at: { type: DataTypes.DATE, allowNull: true },
      internal_notes: { type: DataTypes.STRING(800), allowNull: true },
      reviewed_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex('partner_applications', ['kind', 'status', 'created_at'], { name: 'partner_kind_status_created_idx' });
    await queryInterface.addIndex('partner_applications', ['kind', 'document_hash'], { name: 'partner_kind_document_hash_unique', unique: true });

    await queryInterface.createTable('contact_inquiries', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      status: { type: DataTypes.ENUM('novo', 'em_atendimento', 'encerrado'), allowNull: false, defaultValue: 'novo' },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(190), allowNull: false },
      phone: { type: DataTypes.STRING(24), allowNull: false },
      company: { type: DataTypes.STRING(160), allowNull: false },
      monthly_volume: { type: DataTypes.STRING(40), allowNull: true },
      website: { type: DataTypes.STRING(255), allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      internal_notes: { type: DataTypes.STRING(800), allowNull: true },
      reviewed_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex('contact_inquiries', ['status', 'created_at'], { name: 'contact_status_created_idx' });

    await queryInterface.createTable('shipments', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      tracking_code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      customer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      assigned_courier_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      service_type: { type: DataTypes.ENUM('local', 'national'), allowNull: false },
      status: { type: DataTypes.ENUM('recebido', 'preparando', 'coletado', 'em_transito', 'saiu_para_entrega', 'entregue', 'ocorrencia', 'cancelado'), allowNull: false, defaultValue: 'recebido' },
      origin_address: { type: DataTypes.STRING(300), allowNull: false },
      origin_zip: { type: DataTypes.STRING(9), allowNull: false },
      destination_address: { type: DataTypes.STRING(300), allowNull: false },
      destination_zip: { type: DataTypes.STRING(9), allowNull: false },
      total_weight: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
      total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'BRL' },
      is_demo_rate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      estimated_delivery_at: { type: DataTypes.DATE, allowNull: true },
      delivered_at: { type: DataTypes.DATE, allowNull: true },
      cancelled_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex('shipments', ['customer_id', 'created_at'], { name: 'shipments_customer_created_idx' });
    await queryInterface.addIndex('shipments', ['status', 'created_at'], { name: 'shipments_status_created_idx' });
    await queryInterface.addIndex('shipments', ['assigned_courier_id', 'status'], { name: 'shipments_courier_status_idx' });

    await queryInterface.createTable('shipment_packages', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      shipment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'shipments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      height_cm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      width_cm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      length_cm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      weight_kg: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
      description: { type: DataTypes.STRING(160), allowNull: true }
    });

    await queryInterface.createTable('shipment_events', {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      shipment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'shipments', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      actor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: { type: DataTypes.ENUM('recebido', 'preparando', 'coletado', 'em_transito', 'saiu_para_entrega', 'entregue', 'ocorrencia', 'cancelado'), allowNull: false },
      public_description: { type: DataTypes.STRING(240), allowNull: false },
      private_note: { type: DataTypes.STRING(500), allowNull: true },
      location: { type: DataTypes.STRING(120), allowNull: true },
      is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('shipment_events', ['shipment_id', 'occurred_at'], { name: 'shipment_events_shipment_time_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipment_events');
    await queryInterface.dropTable('shipment_packages');
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('contact_inquiries');
    await queryInterface.dropTable('partner_applications');
    await queryInterface.dropTable('tariffs');
    await queryInterface.dropTable('users');
  }
};

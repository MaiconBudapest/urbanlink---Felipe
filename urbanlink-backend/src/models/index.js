const sequelize = require('../config/database');
const User = require('./User');
const Shipment = require('./Shipment');
const ShipmentPackage = require('./ShipmentPackage');
const ShipmentEvent = require('./ShipmentEvent');
const PartnerApplication = require('./PartnerApplication');
const ContactInquiry = require('./ContactInquiry');
const Tariff = require('./Tariff');

User.hasMany(Shipment, { as: 'shipments', foreignKey: 'customerId' });
Shipment.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
User.hasMany(Shipment, { as: 'assignedShipments', foreignKey: 'assignedCourierId' });
Shipment.belongsTo(User, { as: 'courier', foreignKey: 'assignedCourierId' });
Shipment.hasMany(ShipmentPackage, { as: 'packages', foreignKey: 'shipmentId', onDelete: 'CASCADE' });
ShipmentPackage.belongsTo(Shipment, { as: 'shipment', foreignKey: 'shipmentId' });
Shipment.hasMany(ShipmentEvent, { as: 'events', foreignKey: 'shipmentId', onDelete: 'CASCADE' });
ShipmentEvent.belongsTo(Shipment, { as: 'shipment', foreignKey: 'shipmentId' });
User.hasMany(ShipmentEvent, { as: 'shipmentEvents', foreignKey: 'actorId' });
ShipmentEvent.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
User.hasMany(PartnerApplication, { as: 'reviewedApplications', foreignKey: 'reviewedById' });
PartnerApplication.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedById' });
User.hasMany(ContactInquiry, { as: 'reviewedInquiries', foreignKey: 'reviewedById' });
ContactInquiry.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedById' });
User.hasMany(Tariff, { as: 'updatedTariffs', foreignKey: 'updatedById' });
Tariff.belongsTo(User, { as: 'updatedBy', foreignKey: 'updatedById' });

module.exports = {
  sequelize,
  User,
  Shipment,
  ShipmentPackage,
  ShipmentEvent,
  PartnerApplication,
  ContactInquiry,
  Tariff
};

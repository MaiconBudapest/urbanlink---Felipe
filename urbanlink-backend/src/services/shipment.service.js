const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Shipment, ShipmentPackage, ShipmentEvent, User } = require('../models');
const HttpError = require('../utils/http-error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { serializeShipment, serializeUser } = require('../utils/serializers');
const { createTrackingCode } = require('../utils/tracking-code');
const { createQuote } = require('./quote.service');
const { assertTransition } = require('./shipment-status.service');

const shipmentIncludes = [
  { model: ShipmentPackage, as: 'packages' },
  { model: ShipmentEvent, as: 'events', where: { isPublic: true }, required: false }
];
const staffShipmentIncludes = [
  { model: ShipmentPackage, as: 'packages' },
  { model: ShipmentEvent, as: 'events', required: false }
];

async function quote(input) {
  const pricing = await createQuote(input);
  return {
    modalidade: pricing.serviceType,
    quantidadePacotes: pricing.packageCount,
    pesoTotalKg: pricing.totalWeight,
    valorBase: pricing.basePrice,
    valorPeso: pricing.weightPrice,
    valorPacotes: pricing.packagePrice,
    valorEstimado: pricing.totalPrice,
    moeda: pricing.currency,
    tarifaDemonstracao: pricing.isDemoRate,
    observacao: pricing.disclaimer
  };
}

async function createShipment(customerId, input) {
  const pricing = await createQuote(input);
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.create({
      trackingCode: createTrackingCode(),
      customerId,
      serviceType: pricing.serviceType,
      status: 'recebido',
      originAddress: input.origin.address.trim(),
      originZip: input.origin.zip.replace(/\D/g, ''),
      destinationAddress: input.destination.address.trim(),
      destinationZip: input.destination.zip.replace(/\D/g, ''),
      totalWeight: pricing.totalWeight,
      totalPrice: pricing.totalPrice,
      currency: pricing.currency,
      isDemoRate: pricing.isDemoRate
    }, { transaction });

    await ShipmentPackage.bulkCreate(input.packages.map((item) => ({
      shipmentId: shipment.id,
      heightCm: item.heightCm,
      widthCm: item.widthCm,
      lengthCm: item.lengthCm,
      weightKg: item.weightKg,
      description: item.description?.trim() || null
    })), { transaction });

    await ShipmentEvent.create({
      shipmentId: shipment.id,
      actorId: customerId,
      status: 'recebido',
      publicDescription: 'Pedido recebido pela UrbanLink.',
      location: 'Centro de distribuição UrbanLink',
      isPublic: true
    }, { transaction });
    await transaction.commit();

    return await Shipment.findByPk(shipment.id, { include: shipmentIncludes });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function listOwnShipments(userId, query) {
  const page = getPagination(query);
  const where = { customerId: userId };
  if (page.status) where.status = page.status;
  const { rows, count } = await Shipment.findAndCountAll({
    where,
    include: shipmentIncludes,
    distinct: true,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return { dados: rows.map((item) => serializeShipment(item, { includePrivateAddress: true })), paginacao: paginationMeta(page.page, page.limit, count) };
}

async function listAssignedShipments(userId, query) {
  const page = getPagination(query);
  const where = { assignedCourierId: userId };
  if (page.status) where.status = page.status;
  const { rows, count } = await Shipment.findAndCountAll({
    where,
    include: shipmentIncludes,
    distinct: true,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return { dados: rows.map((item) => serializeShipment(item, { includePrivateAddress: true })), paginacao: paginationMeta(page.page, page.limit, count) };
}

async function listAllShipments(query) {
  const page = getPagination(query);
  const where = {};
  if (page.status) where.status = page.status;
  if (page.search) where.trackingCode = { [Op.like]: `%${page.search}%` };
  const { rows, count } = await Shipment.findAndCountAll({
    where,
    include: [...staffShipmentIncludes, { model: User, as: 'customer' }],
    distinct: true,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return {
    dados: rows.map((item) => ({ ...serializeShipment(item, { includePrivateAddress: true, includePrivateEvents: true }), cliente: serializeUser(item.customer) })),
    paginacao: paginationMeta(page.page, page.limit, count)
  };
}

async function getShipmentById(id, requester) {
  const isStaff = ['administrador', 'operador'].includes(requester.role);
  const shipment = await Shipment.findByPk(id, {
    include: [...(isStaff ? staffShipmentIncludes : shipmentIncludes), { model: User, as: 'customer' }, { model: User, as: 'courier' }]
  });
  if (!shipment) throw new HttpError(404, 'ENVIO_NAO_ENCONTRADO', 'Envio não encontrado.');
  const isOwner = Number(shipment.customerId) === Number(requester.id);
  const isAssignedCourier = Number(shipment.assignedCourierId) === Number(requester.id);
  if (!isStaff && !isOwner && !isAssignedCourier) {
    throw new HttpError(403, 'SEM_PERMISSAO', 'Você não tem permissão para consultar este envio.');
  }
  return {
    ...serializeShipment(shipment, { includePrivateAddress: isStaff || isOwner || isAssignedCourier, includePrivateEvents: isStaff }),
    cliente: isStaff ? serializeUser(shipment.customer) : undefined,
    entregador: isStaff ? serializeUser(shipment.courier) : undefined
  };
}

async function trackByCode(trackingCode) {
  const shipment = await Shipment.findOne({
    where: { trackingCode: trackingCode.toUpperCase() },
    include: [{ model: ShipmentEvent, as: 'events', where: { isPublic: true }, required: false, order: [['occurredAt', 'ASC']] }]
  });
  if (!shipment) throw new HttpError(404, 'RASTREIO_NAO_ENCONTRADO', 'Não encontramos um envio com este código.');
  return serializeShipment(shipment);
}

async function updateStatus(id, actor, input) {
  const transaction = await sequelize.transaction();
  try {
    const shipment = await Shipment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!shipment) throw new HttpError(404, 'ENVIO_NAO_ENCONTRADO', 'Envio não encontrado.');
    if (actor.role === 'entregador' && Number(shipment.assignedCourierId) !== Number(actor.id)) {
      throw new HttpError(403, 'SEM_PERMISSAO', 'Este envio não está atribuído a você.');
    }
    assertTransition(shipment.status, input.status, actor.role);
    shipment.status = input.status;
    if (input.status === 'entregue') shipment.deliveredAt = new Date();
    if (input.status === 'cancelado') shipment.cancelledAt = new Date();
    await shipment.save({ transaction });
    await ShipmentEvent.create({
      shipmentId: shipment.id,
      actorId: actor.id,
      status: input.status,
      publicDescription: input.publicDescription,
      privateNote: input.privateNote || null,
      location: input.location || null,
      isPublic: input.isPublic !== false
    }, { transaction });
    await transaction.commit();
    return getShipmentById(shipment.id, actor);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function assignCourier(id, courierId, actorId) {
  const transaction = await sequelize.transaction();
  try {
    const [shipment, courier] = await Promise.all([
      Shipment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }),
      User.findByPk(courierId, { transaction })
    ]);
    if (!shipment) throw new HttpError(404, 'ENVIO_NAO_ENCONTRADO', 'Envio não encontrado.');
    if (!courier || courier.role !== 'entregador' || courier.status !== 'ativo') {
      throw new HttpError(422, 'ENTREGADOR_INVALIDO', 'Selecione uma conta ativa de entregador.');
    }
    shipment.assignedCourierId = courier.id;
    await shipment.save({ transaction });
    await ShipmentEvent.create({
      shipmentId: shipment.id,
      status: shipment.status,
      actorId,
      publicDescription: 'Atualização operacional do envio.',
      privateNote: `Entregador ${courier.id} vinculado ao envio.`,
      isPublic: false
    }, { transaction });
    await transaction.commit();
    return { id: shipment.id, codigoRastreio: shipment.trackingCode, entregadorId: courier.id, situacao: shipment.status };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOwnShipment(id, userId) {
  const shipment = await Shipment.findOne({ where: { id, customerId: userId } });
  if (!shipment) throw new HttpError(404, 'ENVIO_NAO_ENCONTRADO', 'Envio não encontrado.');
  if (!['recebido', 'preparando'].includes(shipment.status)) {
    throw new HttpError(409, 'CANCELAMENTO_INDISPONIVEL', 'Este envio não pode mais ser cancelado pela conta.');
  }
  return updateStatus(id, { id: userId, role: 'cliente' }, {
    status: 'cancelado',
    publicDescription: 'Pedido cancelado pelo remetente.',
    isPublic: true
  });
}

module.exports = {
  quote,
  createShipment,
  listOwnShipments,
  listAssignedShipments,
  listAllShipments,
  getShipmentById,
  trackByCode,
  updateStatus,
  assignCourier,
  cancelOwnShipment
};

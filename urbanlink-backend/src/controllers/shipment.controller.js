const shipmentService = require('../services/shipment.service');
const { serializeShipment } = require('../utils/serializers');

async function quote(req, res) {
  res.json({ cotacao: await shipmentService.quote(req.validated) });
}

async function create(req, res) {
  const shipment = await shipmentService.createShipment(req.user.id, req.validated);
  res.status(201).json({ mensagem: 'Envio criado.', envio: serializeShipment(shipment, { includePrivateAddress: true }) });
}

async function listOwn(req, res) {
  res.json(await shipmentService.listOwnShipments(req.user.id, req.validated || req.query));
}

async function listAssigned(req, res) {
  res.json(await shipmentService.listAssignedShipments(req.user.id, req.validated || req.query));
}

async function listAll(req, res) {
  res.json(await shipmentService.listAllShipments(req.validated || req.query));
}

async function detail(req, res) {
  res.json({ envio: await shipmentService.getShipmentById(req.params.id, req.user) });
}

async function track(req, res) {
  res.json({ envio: await shipmentService.trackByCode(req.params.codigo) });
}

async function updateStatus(req, res) {
  res.json({ mensagem: 'Situação do envio atualizada.', envio: await shipmentService.updateStatus(req.params.id, req.user, req.validated) });
}

async function assignCourier(req, res) {
  res.json({ mensagem: 'Entregador vinculado ao envio.', envio: await shipmentService.assignCourier(req.params.id, req.validated.courierId, req.user.id) });
}

async function cancelOwn(req, res) {
  res.json({ mensagem: 'Envio cancelado.', envio: await shipmentService.cancelOwnShipment(req.params.id, req.user.id) });
}

module.exports = { quote, create, listOwn, listAssigned, listAll, detail, track, updateStatus, assignCourier, cancelOwn };

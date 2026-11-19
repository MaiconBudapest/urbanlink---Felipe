const tariffService = require('../services/tariff.service');

async function listPublic(_req, res) {
  res.json({ tarifas: await tariffService.listPublicTariffs() });
}

async function listAdmin(_req, res) {
  res.json({ tarifas: await tariffService.listAdminTariffs() });
}

async function upsert(req, res) {
  const tariff = await tariffService.upsertTariff(req.validated, req.user.id);
  res.json({ mensagem: 'Tarifa salva.', tarifa: tariff });
}

async function deactivate(req, res) {
  const tariff = await tariffService.deactivateTariff(req.params.id, req.user.id);
  res.json({ mensagem: 'Tarifa desativada.', tarifa: tariff });
}

module.exports = { listPublic, listAdmin, upsert, deactivate };

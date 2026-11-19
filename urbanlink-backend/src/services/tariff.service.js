const { Tariff } = require('../models');
const HttpError = require('../utils/http-error');

function serializeTariff(tariff) {
  return {
    id: tariff.id,
    modalidade: tariff.serviceType,
    valorBase: Number(tariff.basePrice),
    valorPorKg: Number(tariff.pricePerKg),
    valorPorPacote: Number(tariff.pricePerPackage),
    moeda: tariff.currency,
    demonstracao: Boolean(tariff.isDemo),
    ativa: Boolean(tariff.isActive),
    atualizadaEm: tariff.updatedAt
  };
}

async function listPublicTariffs() {
  const tariffs = await Tariff.findAll({ where: { isActive: true }, order: [['serviceType', 'ASC']] });
  return tariffs.map(serializeTariff);
}

async function listAdminTariffs() {
  const tariffs = await Tariff.findAll({ order: [['serviceType', 'ASC']] });
  return tariffs.map(serializeTariff);
}

async function upsertTariff(input, userId) {
  const [tariff, created] = await Tariff.findOrCreate({
    where: { serviceType: input.serviceType },
    defaults: { ...input, currency: 'BRL', updatedById: userId }
  });
  if (!created) {
    await tariff.update({
      basePrice: input.basePrice,
      pricePerKg: input.pricePerKg,
      pricePerPackage: input.pricePerPackage,
      isDemo: input.isDemo,
      isActive: input.isActive,
      updatedById: userId
    });
  }
  return serializeTariff(tariff);
}

async function deactivateTariff(id, userId) {
  const tariff = await Tariff.findByPk(id);
  if (!tariff) throw new HttpError(404, 'TARIFA_NAO_ENCONTRADA', 'Tarifa não encontrada.');
  tariff.isActive = false;
  tariff.updatedById = userId;
  await tariff.save();
  return serializeTariff(tariff);
}

module.exports = { listPublicTariffs, listAdminTariffs, upsertTariff, deactivateTariff, serializeTariff };

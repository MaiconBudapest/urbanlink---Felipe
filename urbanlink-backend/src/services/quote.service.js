const { Tariff } = require('../models');
const HttpError = require('../utils/http-error');

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateQuote({ tariff, packages }) {
  if (!tariff || !tariff.isActive) {
    throw new HttpError(422, 'MODALIDADE_INDISPONIVEL', 'Não há tarifa ativa para esta modalidade de envio.');
  }
  const totalWeight = money(packages.reduce((sum, item) => sum + Number(item.weightKg), 0));
  const packageCount = packages.length;
  const basePrice = Number(tariff.basePrice);
  const weightPrice = money(Number(tariff.pricePerKg) * totalWeight);
  const packagePrice = money(Number(tariff.pricePerPackage) * Math.max(packageCount - 1, 0));
  const totalPrice = money(basePrice + weightPrice + packagePrice);
  return {
    serviceType: tariff.serviceType,
    packageCount,
    totalWeight,
    currency: tariff.currency,
    basePrice: money(basePrice),
    weightPrice: money(weightPrice),
    packagePrice: money(packagePrice),
    totalPrice,
    isDemoRate: Boolean(tariff.isDemo),
    disclaimer: tariff.isDemo ? 'Estimativa demonstrativa, sujeita a configuração de tarifas e confirmação da operação.' : null
  };
}

async function createQuote({ serviceType, packages }) {
  const tariff = await Tariff.findOne({ where: { serviceType, isActive: true } });
  return calculateQuote({ tariff, packages });
}

module.exports = { calculateQuote, createQuote, money };

process.env.NODE_ENV ||= 'test';
process.env.JWT_SECRET ||= 'urbanlink-test-secret-keep-this-outside-production';
process.env.PII_ENCRYPTION_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateQuote } = require('../../src/services/quote.service');

test('calcula peso, pacotes e valor demonstrativo', () => {
  const result = calculateQuote({
    tariff: { serviceType: 'local', basePrice: '10.00', pricePerKg: '3.50', pricePerPackage: '2.00', currency: 'BRL', isActive: true, isDemo: true },
    packages: [{ weightKg: 1.2 }, { weightKg: 0.8 }]
  });
  assert.equal(result.totalWeight, 2);
  assert.equal(result.packageCount, 2);
  assert.equal(result.totalPrice, 19);
  assert.equal(result.isDemoRate, true);
  assert.match(result.disclaimer, /demonstrativa/i);
});

test('recusa modalidade sem tarifa ativa', () => {
  assert.throws(() => calculateQuote({ tariff: null, packages: [{ weightKg: 1 }] }), { status: 422, code: 'MODALIDADE_INDISPONIVEL' });
});

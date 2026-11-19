process.env.NODE_ENV ||= 'test';
process.env.JWT_SECRET ||= 'urbanlink-test-secret-keep-this-outside-production';
process.env.PII_ENCRYPTION_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encryptPii, decryptPii, fingerprintPii, maskDocument } = require('../../src/utils/pii');

test('criptografa dados e permite sua leitura autenticada', () => {
  const ciphertext = encryptPii('123.456.789-00');
  assert.notEqual(ciphertext, '123.456.789-00');
  assert.equal(decryptPii(ciphertext), '123.456.789-00');
  assert.equal(maskDocument(decryptPii(ciphertext)), '••••••••8900');
});

test('gera impressão digital estável sem armazenar o documento em claro', () => {
  assert.equal(fingerprintPii('usuario', '123.456.789-00'), fingerprintPii('usuario', '12345678900'));
  assert.notEqual(fingerprintPii('usuario', '12345678900'), fingerprintPii('parceria', '12345678900'));
});

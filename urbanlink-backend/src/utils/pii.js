const crypto = require('node:crypto');
const HttpError = require('./http-error');

function masterKey() {
  const raw = process.env.PII_ENCRYPTION_KEY || '';
  if (!/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new HttpError(500, 'CONFIGURACAO_AUSENTE', 'A chave de proteção de dados não está configurada.');
  }
  return Buffer.from(raw, 'hex');
}

function deriveKey(purpose) {
  return Buffer.from(crypto.hkdfSync('sha256', masterKey(), Buffer.from('urbanlink'), Buffer.from(purpose), 32));
}

function encryptPii(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey('encryption-v1'), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decryptPii(payload) {
  if (!payload) return null;
  const [version, ivValue, tagValue, ciphertextValue] = String(payload).split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !ciphertextValue) {
    throw new HttpError(500, 'DADO_PROTEGIDO_INVALIDO', 'Não foi possível ler um dado protegido.');
  }
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey('encryption-v1'), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, 'base64url')),
      decipher.final()
    ]).toString('utf8');
  } catch {
    throw new HttpError(500, 'DADO_PROTEGIDO_INVALIDO', 'Não foi possível ler um dado protegido.');
  }
}

function fingerprintPii(kind, value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const normalized = String(value).normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHmac('sha256', deriveKey('fingerprint-v1')).update(`${kind}:${normalized}`).digest('hex');
}

function maskDocument(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits.length < 4 ? '••••' : `••••••••${digits.slice(-4)}`;
}

module.exports = { encryptPii, decryptPii, fingerprintPii, maskDocument };

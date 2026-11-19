process.env.NODE_ENV ||= 'test';
process.env.JWT_SECRET ||= 'urbanlink-test-secret-keep-this-outside-production';
process.env.PII_ENCRYPTION_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../../src/app');

test('API responde health e rejeita payload de login inválido', async (t) => {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const live = await fetch(`${base}/api/health/live`);
  assert.equal(live.status, 200);
  assert.equal((await live.json()).estado, 'ativo');

  const docs = await fetch(`${base}/api/docs/`);
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /swagger/i);

  const frontendPath = path.resolve(__dirname, '..', '..', 'public');
  if (fs.existsSync(frontendPath)) {
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /UrbanLink/i);
  }

  const invalid = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nao-e-email', senha: 'x' })
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).codigo, 'DADOS_INVALIDOS');

  const attemptedElevation = await fetch(`${base}/api/usuarios`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Conta de teste', email: 'teste@example.com', password: 'senha-segura',
      phone: '11987654321', document: '12345678900', role: 'administrador'
    })
  });
  assert.equal(attemptedElevation.status, 400);
  assert.equal((await attemptedElevation.json()).codigo, 'DADOS_INVALIDOS');
});

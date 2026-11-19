const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTransition } = require('../../src/services/shipment-status.service');

test('permite avançar o envio e restringe transições de entregador', () => {
  assert.doesNotThrow(() => assertTransition('recebido', 'preparando', 'operador'));
  assert.doesNotThrow(() => assertTransition('saiu_para_entrega', 'entregue', 'entregador'));
  assert.throws(() => assertTransition('recebido', 'entregue', 'administrador'), { status: 409, code: 'TRANSICAO_INVALIDA' });
  assert.throws(() => assertTransition('em_transito', 'cancelado', 'entregador'), { status: 403, code: 'ACAO_NAO_PERMITIDA' });
});

const HttpError = require('../utils/http-error');

const transitions = Object.freeze({
  recebido: ['preparando', 'cancelado'],
  preparando: ['coletado', 'em_transito', 'ocorrencia', 'cancelado'],
  coletado: ['em_transito', 'ocorrencia'],
  em_transito: ['saiu_para_entrega', 'ocorrencia'],
  saiu_para_entrega: ['entregue', 'em_transito', 'ocorrencia'],
  ocorrencia: ['em_transito', 'saiu_para_entrega', 'cancelado'],
  entregue: [],
  cancelado: []
});

const courierTransitions = new Set(['coletado', 'saiu_para_entrega', 'entregue', 'ocorrencia']);

function assertTransition(current, next, role) {
  if (role === 'entregador' && !courierTransitions.has(next)) {
    throw new HttpError(403, 'ACAO_NAO_PERMITIDA', 'Entregadores não podem aplicar esta atualização.');
  }
  if (!transitions[current]?.includes(next)) {
    throw new HttpError(409, 'TRANSICAO_INVALIDA', 'Esta mudança de situação não é permitida para o envio.');
  }
}

module.exports = { transitions, assertTransition };

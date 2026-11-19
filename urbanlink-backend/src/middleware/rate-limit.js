const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function createLimiter(max, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      codigo: 'MUITAS_TENTATIVAS',
      mensagem: message
    })
  });
}

module.exports = {
  authLimiter: createLimiter(env.rateLimits.authMax, 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.'),
  publicFormLimiter: createLimiter(env.rateLimits.publicFormMax, 'Muitas solicitações recebidas. Aguarde alguns minutos e tente novamente.')
};

const partnerService = require('../services/partner.service');

async function applyCourier(req, res) {
  const application = await partnerService.createApplication('entregador', req.validated);
  res.status(201).json({ mensagem: 'Solicitação de parceria recebida.', solicitacao: application });
}

async function applyPoint(req, res) {
  const application = await partnerService.createApplication('ponto_entrega', req.validated);
  res.status(201).json({ mensagem: 'Solicitação de parceria recebida.', solicitacao: application });
}

async function list(req, res) {
  res.json(await partnerService.listApplications(req.validated || req.query));
}

async function review(req, res) {
  const application = await partnerService.reviewApplication(req.params.id, req.user.id, req.validated);
  res.json({ mensagem: 'Solicitação atualizada.', solicitacao: application });
}

module.exports = { applyCourier, applyPoint, list, review };

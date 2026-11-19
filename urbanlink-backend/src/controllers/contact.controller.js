const contactService = require('../services/contact.service');

async function create(req, res) {
  const result = await contactService.createInquiry(req.validated);
  res.status(201).json(result);
}

async function list(req, res) {
  res.json(await contactService.listInquiries(req.validated || req.query));
}

async function update(req, res) {
  const inquiry = await contactService.updateInquiry(req.params.id, req.user.id, req.validated);
  res.json({ mensagem: 'Mensagem atualizada.', contato: inquiry });
}

module.exports = { create, list, update };

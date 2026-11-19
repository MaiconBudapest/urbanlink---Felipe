const authService = require('../services/auth.service');
const userService = require('../services/user.service');

async function updateMe(req, res) {
  const user = await authService.updateOwnProfile(req.user.id, req.validated);
  res.json({ mensagem: 'Dados da conta atualizados.', usuario: user });
}

async function list(req, res) {
  res.json(await userService.listUsers(req.validated || req.query));
}

async function update(req, res) {
  const user = await userService.updateUser(req.params.id, req.validated, req.user.id);
  res.json({ mensagem: 'Conta atualizada.', usuario: user });
}

async function deactivate(req, res) {
  await userService.deactivateUser(req.params.id, req.user.id);
  res.json({ mensagem: 'Conta desativada.' });
}

module.exports = { updateMe, list, update, deactivate };

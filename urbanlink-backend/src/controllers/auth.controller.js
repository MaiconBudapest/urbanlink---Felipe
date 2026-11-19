const authService = require('../services/auth.service');
const { serializeUser } = require('../utils/serializers');

async function register(req, res) {
  const result = await authService.register(req.validated);
  res.status(201).json({ mensagem: 'Conta criada com sucesso.', usuario: result.user, token: result.token });
}

async function login(req, res) {
  const result = await authService.login(req.validated);
  res.status(200).json({ mensagem: 'Acesso realizado com sucesso.', usuario: result.user, token: result.token });
}

async function logout(req, res) {
  await authService.logout(req.user.id);
  res.status(200).json({ mensagem: 'Sessão encerrada.' });
}

function me(req, res) {
  res.json({ usuario: serializeUser(req.user) });
}

module.exports = { register, login, logout, me };

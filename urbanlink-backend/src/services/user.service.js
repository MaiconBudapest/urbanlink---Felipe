const { Op } = require('sequelize');
const { User } = require('../models');
const HttpError = require('../utils/http-error');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { serializeUser } = require('../utils/serializers');

async function listUsers(query) {
  const page = getPagination(query);
  const where = {};
  if (page.search) where[Op.or] = [
    { name: { [Op.like]: `%${page.search}%` } },
    { email: { [Op.like]: `%${page.search}%` } }
  ];
  if (page.status) where.status = page.status;
  if (page.type) where.role = page.type;

  const { rows, count } = await User.findAndCountAll({
    where,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return { dados: rows.map(serializeUser), paginacao: paginationMeta(page.page, page.limit, count) };
}

async function updateUser(id, input, requesterId) {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'USUARIO_NAO_ENCONTRADO', 'Conta não encontrada.');
  if (Number(id) === Number(requesterId) && (input.role !== undefined || input.status !== undefined)) {
    throw new HttpError(400, 'AUTOALTERACAO_DE_PERFIL_BLOQUEADA', 'Use outra conta administradora para alterar seu próprio perfil ou situação.');
  }
  const removesActiveAdministrator = user.role === 'administrador' && user.status === 'ativo'
    && ((input.role !== undefined && input.role !== 'administrador') || (input.status !== undefined && input.status !== 'ativo'));
  if (removesActiveAdministrator) {
    const activeAdministrators = await User.count({ where: { role: 'administrador', status: 'ativo' } });
    if (activeAdministrators <= 1) {
      throw new HttpError(409, 'ULTIMO_ADMINISTRADOR', 'Mantenha ao menos uma conta administradora ativa.');
    }
  }
  if (input.role !== undefined) user.role = input.role;
  if (input.status !== undefined) user.status = input.status;
  await user.save();
  return serializeUser(user);
}

async function deactivateUser(id, requesterId) {
  if (Number(id) === Number(requesterId)) {
    throw new HttpError(400, 'AUTO_EXCLUSAO_BLOQUEADA', 'Use outro administrador para desativar esta conta.');
  }
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'USUARIO_NAO_ENCONTRADO', 'Conta não encontrada.');
  if (user.role === 'administrador' && user.status === 'ativo') {
    const activeAdministrators = await User.count({ where: { role: 'administrador', status: 'ativo' } });
    if (activeAdministrators <= 1) {
      throw new HttpError(409, 'ULTIMO_ADMINISTRADOR', 'Mantenha ao menos uma conta administradora ativa.');
    }
  }
  await user.destroy();
}

module.exports = { listUsers, updateUser, deactivateUser };

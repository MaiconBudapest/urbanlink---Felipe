const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/http-error');

async function authenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return next(new HttpError(401, 'NAO_AUTENTICADO', 'Envie um token de acesso válido.'));

  try {
    const claims = jwt.verify(match[1], env.jwt.secret, {
      issuer: 'urbanlink-api',
      audience: 'urbanlink-clients'
    });
    const userId = Number(claims.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      return next(new HttpError(401, 'TOKEN_INVALIDO', 'A sessão é inválida ou expirou.'));
    }
    const user = await User.unscoped().findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'tokenVersion']
    });
    if (!user || user.status !== 'ativo' || Number(claims.ver) !== Number(user.tokenVersion)) {
      return next(new HttpError(401, 'TOKEN_INVALIDO', 'A sessão é inválida ou expirou.'));
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
    return next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(401, 'TOKEN_INVALIDO', 'A sessão é inválida ou expirou.'));
  }
}

function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'NAO_AUTENTICADO', 'Faça login para continuar.'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'SEM_PERMISSAO', 'Sem permissão para essa ação.'));
    return next();
  };
}

module.exports = { authenticate, requireRoles };

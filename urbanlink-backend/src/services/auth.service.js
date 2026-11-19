const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UniqueConstraintError } = require('sequelize');
const env = require('../config/env');
const { User } = require('../models');
const HttpError = require('../utils/http-error');
const { encryptPii, fingerprintPii } = require('../utils/pii');
const { serializeUser } = require('../utils/serializers');

const PASSWORD_ROUNDS = 12;
const secretUserAttributes = ['id', 'name', 'email', 'passwordHash', 'role', 'status', 'phone', 'documentCiphertext', 'documentHash', 'tokenVersion', 'createdAt', 'updatedAt'];

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function issueToken(user) {
  return jwt.sign({ role: user.role, ver: user.tokenVersion }, env.jwt.secret, {
    subject: String(user.id),
    expiresIn: env.jwt.expiresIn,
    issuer: 'urbanlink-api',
    audience: 'urbanlink-clients'
  });
}

async function register(input) {
  const email = normalizeEmail(input.email);
  const documentHash = fingerprintPii('usuario', input.document);
  try {
    const user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, PASSWORD_ROUNDS),
      phone: input.phone || null,
      documentCiphertext: encryptPii(input.document),
      documentHash,
      role: 'cliente'
    });
    return { user: serializeUser(user), token: issueToken(user) };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, 'CONTA_EXISTENTE', 'Já existe uma conta com este e-mail ou documento.');
    }
    throw error;
  }
}

async function login({ email: rawEmail, password }) {
  const email = normalizeEmail(rawEmail);
  const user = await User.unscoped().findOne({ where: { email }, attributes: secretUserAttributes });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');
  }
  if (user.status !== 'ativo') {
    throw new HttpError(403, 'CONTA_SUSPENSA', 'Esta conta está suspensa. Entre em contato com a equipe UrbanLink.');
  }
  return { user: serializeUser(user), token: issueToken(user) };
}

async function updateOwnProfile(userId, input) {
  const user = await User.unscoped().findByPk(userId, { attributes: ['id', 'tokenVersion'] });
  if (!user) throw new HttpError(404, 'USUARIO_NAO_ENCONTRADO', 'Conta não encontrada.');

  if (input.name !== undefined) user.name = input.name.trim();
  if (input.email !== undefined) user.email = normalizeEmail(input.email);
  if (input.phone !== undefined) user.phone = input.phone || null;
  if (input.document !== undefined) {
    user.documentCiphertext = encryptPii(input.document);
    user.documentHash = fingerprintPii('usuario', input.document);
  }
  try {
    await user.save();
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, 'DADO_JA_CADASTRADO', 'Este e-mail ou documento já está vinculado a outra conta.');
    }
    throw error;
  }
  return serializeUser(user);
}

async function logout(userId) {
  const user = await User.unscoped().findByPk(userId, { attributes: secretUserAttributes });
  if (!user) return;
  user.tokenVersion += 1;
  await user.save({ fields: ['tokenVersion'] });
}

module.exports = { register, login, updateOwnProfile, logout, issueToken, normalizeEmail };

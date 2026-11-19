const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { ZodError } = require('zod');
const HttpError = require('../utils/http-error');
const env = require('../config/env');

function notFound(_req, _res, next) {
  next(new HttpError(404, 'ROTA_NAO_ENCONTRADA', 'O endereço solicitado não existe.'));
}

function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;

  let status = 500;
  let code = 'ERRO_INTERNO';
  let message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
  let details;

  if (error instanceof HttpError) {
    status = error.status;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    status = 400;
    code = 'DADOS_INVALIDOS';
    message = 'Confira os dados enviados.';
    details = error.issues.map((issue) => ({ campo: issue.path.join('.'), mensagem: issue.message }));
  } else if (error instanceof UniqueConstraintError) {
    status = 409;
    code = 'REGISTRO_DUPLICADO';
    message = 'Já existe um registro com estes dados.';
  } else if (error instanceof ValidationError) {
    status = 400;
    code = 'DADOS_INVALIDOS';
    message = 'Um ou mais dados não são válidos.';
  } else if (error instanceof ForeignKeyConstraintError) {
    status = 409;
    code = 'RELACAO_INVALIDA';
    message = 'A operação não pode ser concluída por causa de registros relacionados.';
  } else if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError && 'body' in error) {
    status = 400;
    code = 'JSON_INVALIDO';
    message = 'O corpo da solicitação precisa estar em JSON válido.';
  } else if (error?.status && error.status < 500) {
    status = error.status;
    code = 'SOLICITACAO_INVALIDA';
    message = 'Confira o formato da solicitação.';
  }

  if (status >= 500) {
    const log = { requestId: req.id, name: error?.name || 'Error', message: error?.message || 'unknown' };
    if (!env.isProduction && error?.stack) log.stack = error.stack;
    console.error(log);
  }

  const body = { codigo: code, mensagem: message, requestId: req.id };
  if (details) body.detalhes = details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };

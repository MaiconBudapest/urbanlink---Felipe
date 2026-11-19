const HttpError = require('../utils/http-error');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message
      }));
      return next(new HttpError(400, 'DADOS_INVALIDOS', 'Confira os dados enviados.', details));
    }
    req.validated = parsed.data;
    return next();
  };
}

module.exports = validate;

const { z } = require('zod');

const digits = (value) => typeof value === 'string' ? value.replace(/\D/g, '') : value;
const postalCode = z.preprocess(digits, z.string().length(8, 'Informe um CEP com 8 dígitos.'));
const phone = z.preprocess(digits, z.union([
  z.string().length(10, 'Informe um telefone com DDD.'),
  z.string().length(11, 'Informe um telefone com DDD.')
]));
const document = z.preprocess(digits, z.union([
  z.string().length(11, 'Informe um CPF válido.'),
  z.string().length(14, 'Informe um CNPJ válido.'),
  z.literal('')
]));
const email = z.string().trim().email('Informe um e-mail válido.').max(190).transform((value) => value.toLowerCase());

module.exports = { z, digits, postalCode, phone, document, email };

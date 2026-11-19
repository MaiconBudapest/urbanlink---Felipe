const { z, email, phone, postalCode, document } = require('./common');

const courierApplicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  phone,
  license: z.string().trim().min(5).max(32),
  zip: postalCode,
  state: z.string().trim().min(2).max(80),
  vehicle: z.enum(['bicicleta', 'moto', 'carro', 'van', 'outro']),
  consent: z.literal(true, { error: 'É necessário confirmar o uso dos dados para esta solicitação.' })
}).strict();

const pointApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  responsibleName: z.string().trim().min(2).max(120),
  email,
  phone,
  cnpj: z.preprocess((value) => typeof value === 'string' ? value.replace(/\D/g, '') : value, z.string().length(14, 'Informe um CNPJ com 14 dígitos.')),
  zip: postalCode,
  state: z.string().trim().min(2).max(80),
  hours: z.string().trim().min(3).max(120),
  days: z.array(z.enum(['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'])).min(1).max(7),
  consent: z.literal(true, { error: 'É necessário confirmar o uso dos dados para esta solicitação.' })
}).strict();

const reviewApplicationSchema = z.object({
  status: z.enum(['em_analise', 'aprovado', 'rejeitado']),
  internalNotes: z.string().trim().max(800).optional()
}).strict();

module.exports = { courierApplicationSchema, pointApplicationSchema, reviewApplicationSchema };

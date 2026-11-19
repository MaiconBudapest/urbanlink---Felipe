const { z, postalCode } = require('./common');

const packageSchema = z.object({
  heightCm: z.coerce.number().positive().max(200),
  widthCm: z.coerce.number().positive().max(200),
  lengthCm: z.coerce.number().positive().max(200),
  weightKg: z.coerce.number().positive().max(50),
  description: z.string().trim().max(160).optional()
}).strict();

const serviceType = z.enum(['local', 'national']);
const packages = z.array(packageSchema).min(1, 'Informe ao menos um pacote.').max(4, 'O limite é de 4 pacotes por envio.');

const quoteSchema = z.object({ serviceType, packages }).strict();
const createShipmentSchema = z.object({
  serviceType,
  origin: z.object({ address: z.string().trim().min(5).max(300), zip: postalCode }).strict(),
  destination: z.object({ address: z.string().trim().min(5).max(300), zip: postalCode }).strict(),
  packages
}).strict();

const statusUpdateSchema = z.object({
  status: z.enum(['preparando', 'coletado', 'em_transito', 'saiu_para_entrega', 'entregue', 'ocorrencia', 'cancelado']),
  publicDescription: z.string().trim().min(5).max(240),
  privateNote: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  isPublic: z.boolean().default(true)
}).strict();

const assignCourierSchema = z.object({ courierId: z.coerce.number().int().positive() }).strict();

module.exports = { packageSchema, quoteSchema, createShipmentSchema, statusUpdateSchema, assignCourierSchema };

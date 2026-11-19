const { z, email, phone } = require('./common');

const createContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  phone,
  company: z.string().trim().min(2).max(160),
  monthlyVolume: z.enum(['Até 100', '101 a 500', '501 a 2.000', 'Mais de 2.000']).or(z.literal('')).optional(),
  website: z.union([z.string().trim().url().max(255), z.literal('')]).optional(),
  message: z.string().trim().min(10).max(4000)
}).strict();

const updateContactSchema = z.object({
  status: z.enum(['novo', 'em_atendimento', 'encerrado']),
  internalNotes: z.string().trim().max(800).optional()
}).strict();

module.exports = { createContactSchema, updateContactSchema };

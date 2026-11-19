const { z, email, phone, document } = require('./common');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
  phone,
  document: document.refine((value) => value.length > 0, 'Informe um CPF ou CNPJ.')
}).strict();

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72)
}).strict();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: email.optional(),
  phone: phone.or(z.literal('')).optional(),
  document: document.optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'Informe pelo menos um dado para atualizar.');

const adminUserUpdateSchema = z.object({
  role: z.enum(['cliente', 'operador', 'administrador', 'entregador', 'ponto_entrega']).optional(),
  status: z.enum(['ativo', 'suspenso']).optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'Informe o perfil ou a situação para atualizar.');

module.exports = { registerSchema, loginSchema, updateProfileSchema, adminUserUpdateSchema };

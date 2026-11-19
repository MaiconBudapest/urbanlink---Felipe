const path = require('node:path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Na Vercel, o próprio endereço do projeto é a origem do front-end (o site fica em public/)
// e as requisições sempre passam pelo proxy da Vercel.
const onVercel = Boolean(process.env.VERCEL);
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);
const defaultFrontendOrigins = vercelOrigins.length
  ? [...new Set(vercelOrigins)].join(',')
  : 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().min(1).default('urbanlink'),
  DB_USER: z.string().min(1).default('urbanlink_app'),
  DB_PASSWORD: z.string().default(''),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres.'),
  JWT_EXPIRES_IN: z.string().min(2).default('8h'),
  PII_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/, 'PII_ENCRYPTION_KEY precisa ter 64 caracteres hexadecimais.'),
  DB_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  FRONTEND_ORIGINS: z.string().default(defaultFrontendOrigins),
  TRUST_PROXY: z.enum(['true', 'false']).default(onVercel ? 'true' : 'false').transform((value) => value === 'true'),
  DB_LOGGING: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(10),
  PUBLIC_FORM_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(8)
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && (!value.DB_PASSWORD || value.DB_PASSWORD.startsWith('troque-'))) {
    context.addIssue({ code: 'custom', path: ['DB_PASSWORD'], message: 'Defina uma senha para a conta MySQL em produção.' });
  }
  const localOrigins = value.FRONTEND_ORIGINS.split(',').map((origin) => origin.trim());
  if (value.NODE_ENV === 'production' && (localOrigins.some((origin) => !origin || /localhost|127\.0\.0\.1/i.test(origin)))) {
    context.addIssue({ code: 'custom', path: ['FRONTEND_ORIGINS'], message: 'Configure apenas as origens reais do front-end em produção.' });
  }
  if (value.NODE_ENV === 'production' && value.JWT_SECRET.startsWith('troque-')) {
    context.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'Substitua o segredo de exemplo por uma chave própria.' });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const summary = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Configuração inválida. Confira o arquivo .env (ou as Environment Variables da Vercel). ${summary}`);
}

const values = parsed.data;

module.exports = Object.freeze({
  nodeEnv: values.NODE_ENV,
  isProduction: values.NODE_ENV === 'production',
  port: values.PORT,
  database: {
    host: values.DB_HOST,
    port: values.DB_PORT,
    name: values.DB_NAME,
    user: values.DB_USER,
    password: values.DB_PASSWORD,
    ssl: values.DB_SSL,
    logging: values.DB_LOGGING
  },
  jwt: { secret: values.JWT_SECRET, expiresIn: values.JWT_EXPIRES_IN },
  piiEncryptionKey: values.PII_ENCRYPTION_KEY,
  frontendOrigins: values.FRONTEND_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: values.TRUST_PROXY,
  rateLimits: {
    authMax: values.AUTH_RATE_LIMIT_MAX,
    publicFormMax: values.PUBLIC_FORM_RATE_LIMIT_MAX
  }
});

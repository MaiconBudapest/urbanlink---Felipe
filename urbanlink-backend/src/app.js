const path = require('node:path');
const fs = require('node:fs');
const express = require('express');

// Se a API não consegue iniciar (por exemplo, faltam variáveis de ambiente na Vercel),
// em vez de derrubar a função com FUNCTION_INVOCATION_FAILED ela responde 503 dizendo o motivo.
let app;
try {
  app = createApp();
} catch (error) {
  console.error('A API não iniciou:', error);
  app = createStartupErrorApp(error);
}

module.exports = app;

function createApp() {
  const cors = require('cors');
  const helmet = require('helmet');
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yaml');
  const env = require('./config/env');
  const sequelize = require('./config/database');
  const apiRoutes = require('./routes/api.routes');
  const requestId = require('./middleware/request-id');
  const { notFound, errorHandler } = require('./middleware/error-handler');
  const HttpError = require('./utils/http-error');

  const server = express();
  const openApiPath = path.resolve(__dirname, '..', 'openapi.yaml');
  const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
  // A Vercel só leva para a função os arquivos que o código referencia. Esta checagem faz ela
  // incluir também os arquivos visuais do Swagger UI; sem isso, /api/docs abre em branco.
  try {
    const swaggerUiDist = path.dirname(require.resolve('swagger-ui-dist/package.json'));
    fs.existsSync(path.join(swaggerUiDist, 'swagger-ui-bundle.js'));
  } catch {
    // Só afeta a aparência de /api/docs; a API continua funcionando.
  }
  // Na Vercel, os arquivos de public/ são servidos direto pela CDN; localmente, pelo express.static abaixo.
  const frontendPath = path.resolve(__dirname, '..', 'public');

  if (env.trustProxy) server.set('trust proxy', 1);
  server.disable('x-powered-by');
  server.use(requestId);
  server.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    }
  }));
  server.use(cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new HttpError(403, 'ORIGEM_NAO_PERMITIDA', 'Esta origem não está autorizada.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  }));
  server.use(express.json({ limit: '1mb', strict: true }));

  server.get('/api/health/live', (_req, res) => res.json({ estado: 'ativo', servico: 'urbanlink-api' }));
  server.get('/api/health/ready', async (_req, res) => {
    try {
      await sequelize.authenticate();
      return res.json({ estado: 'pronto', banco: 'conectado' });
    } catch {
      return res.status(503).json({ codigo: 'BANCO_INDISPONIVEL', mensagem: 'O serviço está ativo, mas o banco de dados não está disponível.' });
    }
  });
  server.get('/api/health', (_req, res) => res.redirect(307, '/api/health/ready'));
  server.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

  // A mesma API fica disponível com prefixo /api e nos caminhos base descritos nos módulos.
  server.use('/api', apiRoutes);
  server.use('/', apiRoutes);

  if (fs.existsSync(frontendPath)) {
    server.use(express.static(frontendPath, { dotfiles: 'deny', index: 'index.html', fallthrough: true }));
  }

  server.use(notFound);
  server.use(errorHandler);

  return server;
}

function createStartupErrorApp(error) {
  const fallback = express();
  fallback.disable('x-powered-by');
  fallback.use((_req, res) => {
    res.status(503).json({
      codigo: 'API_NAO_INICIOU',
      mensagem: 'A API não conseguiu iniciar. Confira as variáveis de ambiente do projeto e faça um novo deploy.',
      detalhes: error?.message || 'Erro desconhecido.'
    });
  });
  return fallback;
}

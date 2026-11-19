const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
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

const app = express();
const openApiPath = path.resolve(__dirname, '..', 'openapi.yaml');
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
const frontendPath = path.resolve(__dirname, '..', '..', 'urbanlink-site');

if (env.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestId);
app.use(helmet({
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
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new HttpError(403, 'ORIGEM_NAO_PERMITIDA', 'Esta origem não está autorizada.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));
app.use(express.json({ limit: '1mb', strict: true }));

app.get('/api/health/live', (_req, res) => res.json({ estado: 'ativo', servico: 'urbanlink-api' }));
app.get('/api/health/ready', async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ estado: 'pronto', banco: 'conectado' });
  } catch {
    return res.status(503).json({ codigo: 'BANCO_INDISPONIVEL', mensagem: 'O serviço está ativo, mas o banco de dados não está disponível.' });
  }
});
app.get('/api/health', (_req, res) => res.redirect(307, '/api/health/ready'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

// A mesma API fica disponível com prefixo /api e nos caminhos base descritos nos módulos.
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath, { dotfiles: 'deny', index: 'index.html', fallthrough: true }));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;

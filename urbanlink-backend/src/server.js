const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

const server = app.listen(env.port, () => {
  console.log(`UrbanLink API disponível na porta ${env.port}.`);
});

async function shutdown(signal) {
  console.log(`Encerrando após ${signal}.`);
  server.close(async () => {
    await sequelize.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('Promise rejeitada sem tratamento:', error);
  server.close(() => process.exit(1));
});

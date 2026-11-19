const app = require('./app');

// A porta vem direto do ambiente para o servidor subir mesmo quando a configuração está incompleta;
// nesse caso o app responde 503 explicando o que falta (veja src/app.js).
const port = Number(process.env.PORT) || 3000;

let sequelize = null;
try {
  ({ sequelize } = require('./models'));
} catch {
  // Configuração inválida: o erro já foi mostrado por src/app.js.
}

const server = app.listen(port, () => {
  console.log(`UrbanLink API disponível na porta ${port}.`);
});

async function shutdown(signal) {
  console.log(`Encerrando após ${signal}.`);
  server.close(async () => {
    if (sequelize) await sequelize.close();
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

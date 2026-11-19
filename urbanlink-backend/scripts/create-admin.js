require('../src/config/env');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { sequelize, User } = require('../src/models');

const input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  password: z.string().min(12).max(72)
}).safeParse({
  name: process.env.ADMIN_NAME,
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
});

if (!input.success) {
  console.error('Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 12 caracteres) no ambiente antes de executar.');
  process.exitCode = 1;
} else {
  (async () => {
    try {
      await sequelize.authenticate();
      const email = input.data.email.toLowerCase();
      const existing = await User.unscoped().findOne({ where: { email } });
      if (existing) throw new Error('Já existe uma conta com este e-mail.');
      const passwordHash = await bcrypt.hash(input.data.password, 12);
      const user = await User.create({ name: input.data.name, email, passwordHash, role: 'administrador', status: 'ativo' });
      console.log(`Conta administrativa criada (id ${user.id}).`);
    } catch (error) {
      console.error(`Não foi possível criar a conta administrativa: ${error.message}`);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}

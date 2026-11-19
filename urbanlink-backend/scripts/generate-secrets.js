const { randomBytes } = require('node:crypto');

console.log('Cole os valores abaixo em .env. Não compartilhe nem envie esse arquivo ao Git.');
console.log(`JWT_SECRET=${randomBytes(48).toString('base64url')}`);
console.log(`PII_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}`);

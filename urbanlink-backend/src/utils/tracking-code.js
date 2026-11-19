const { randomBytes } = require('node:crypto');

function createTrackingCode() {
  const blocks = randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g);
  return `UL-${blocks.join('-')}`;
}

module.exports = { createTrackingCode };

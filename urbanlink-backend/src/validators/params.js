const { z } = require('zod');

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() }).strict();
const trackingParamsSchema = z.object({ codigo: z.string().trim().min(4).max(32).regex(/^[a-zA-Z0-9-]+$/) }).strict();

module.exports = { idParamsSchema, trackingParamsSchema };

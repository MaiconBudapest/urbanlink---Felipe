const { z } = require('./common');

const tariffSchema = z.object({
  serviceType: z.enum(['local', 'national']),
  basePrice: z.coerce.number().min(0).max(100000),
  pricePerKg: z.coerce.number().min(0).max(100000),
  pricePerPackage: z.coerce.number().min(0).max(100000).default(0),
  isDemo: z.boolean().default(false),
  isActive: z.boolean().default(true)
}).strict();

module.exports = { tariffSchema };

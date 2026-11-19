const { z } = require('zod');

const querySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  tipo: z.string().trim().max(40).optional()
}).strict();

function getPagination(query) {
  const parsed = querySchema.parse(query);
  return {
    page: parsed.pagina,
    limit: parsed.limite,
    offset: (parsed.pagina - 1) * parsed.limite,
    search: parsed.busca,
    status: parsed.status,
    type: parsed.tipo
  };
}

function paginationMeta(page, limit, total) {
  return {
    pagina: page,
    limite: limit,
    total,
    paginas: Math.ceil(total / limit)
  };
}

module.exports = { getPagination, paginationMeta, querySchema };

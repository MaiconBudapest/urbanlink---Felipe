const { Op } = require('sequelize');
const { ContactInquiry } = require('../models');
const HttpError = require('../utils/http-error');
const { getPagination, paginationMeta } = require('../utils/pagination');

function serializeInquiry(inquiry) {
  return {
    id: inquiry.id,
    situacao: inquiry.status,
    nome: inquiry.name,
    email: inquiry.email,
    telefone: inquiry.phone,
    empresa: inquiry.company,
    entregasMensais: inquiry.monthlyVolume,
    site: inquiry.website,
    mensagem: inquiry.message,
    observacoesInternas: inquiry.internalNotes,
    criadoEm: inquiry.createdAt,
    analisadoEm: inquiry.reviewedAt
  };
}

async function createInquiry(input) {
  const inquiry = await ContactInquiry.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    company: input.company.trim(),
    monthlyVolume: input.monthlyVolume || null,
    website: input.website || null,
    message: input.message.trim()
  });
  return { id: inquiry.id, situacao: inquiry.status, mensagem: 'Mensagem registrada para análise.' };
}

async function listInquiries(query) {
  const page = getPagination(query);
  const where = {};
  if (page.status) where.status = page.status;
  if (page.search) where[Op.or] = [
    { name: { [Op.like]: `%${page.search}%` } },
    { email: { [Op.like]: `%${page.search}%` } },
    { company: { [Op.like]: `%${page.search}%` } }
  ];
  const { rows, count } = await ContactInquiry.findAndCountAll({
    where,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return { dados: rows.map(serializeInquiry), paginacao: paginationMeta(page.page, page.limit, count) };
}

async function updateInquiry(id, reviewerId, input) {
  const inquiry = await ContactInquiry.findByPk(id);
  if (!inquiry) throw new HttpError(404, 'CONTATO_NAO_ENCONTRADO', 'Mensagem de contato não encontrada.');
  inquiry.status = input.status;
  inquiry.internalNotes = input.internalNotes || null;
  inquiry.reviewedById = reviewerId;
  inquiry.reviewedAt = new Date();
  await inquiry.save();
  return serializeInquiry(inquiry);
}

module.exports = { createInquiry, listInquiries, updateInquiry };

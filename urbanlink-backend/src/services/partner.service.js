const { Op, UniqueConstraintError } = require('sequelize');
const { PartnerApplication } = require('../models');
const HttpError = require('../utils/http-error');
const { encryptPii, fingerprintPii, decryptPii, maskDocument } = require('../utils/pii');
const { getPagination, paginationMeta } = require('../utils/pagination');

function serializePublic(application) {
  return { id: application.id, tipo: application.kind, situacao: application.status, criadoEm: application.createdAt };
}

function serializeAdmin(application) {
  return {
    ...serializePublic(application),
    nome: application.name,
    email: application.email,
    telefone: application.phone,
    estabelecimento: application.businessName,
    documentoMascarado: maskDocument(decryptPii(application.documentCiphertext)),
    possuiCnh: Boolean(application.licenseCiphertext),
    veiculo: application.vehicle,
    cep: application.zip,
    estado: application.state,
    horario: application.hours,
    dias: application.days,
    consentimentoRegistrado: application.consentAccepted,
    observacoesInternas: application.internalNotes,
    analisadoEm: application.reviewedAt
  };
}

async function createApplication(kind, input) {
  const document = input.document || input.cnpj;
  const documentHash = fingerprintPii(`parceria-${kind}`, document);
  if (documentHash && await PartnerApplication.findOne({ where: { kind, documentHash } })) {
    throw new HttpError(409, 'SOLICITACAO_DUPLICADA', 'Já existe uma solicitação para este documento e tipo de parceria.');
  }
  try {
    const application = await PartnerApplication.create({
      kind,
      name: (input.name || input.responsibleName).trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      businessName: input.businessName || null,
      documentCiphertext: encryptPii(document),
      documentHash,
      licenseCiphertext: encryptPii(input.license),
      vehicle: input.vehicle || null,
      zip: input.zip.replace(/\D/g, ''),
      state: input.state,
      hours: input.hours || null,
      days: input.days || null,
      consentAccepted: input.consent === true,
      consentedAt: input.consent === true ? new Date() : null
    });
    return serializePublic(application);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, 'SOLICITACAO_DUPLICADA', 'Já existe uma solicitação para este documento e tipo de parceria.');
    }
    throw error;
  }
}

async function listApplications(query) {
  const page = getPagination(query);
  const where = {};
  if (page.status) where.status = page.status;
  if (page.type) where.kind = page.type;
  if (page.search) where[Op.or] = [
    { name: { [Op.like]: `%${page.search}%` } },
    { email: { [Op.like]: `%${page.search}%` } },
    { businessName: { [Op.like]: `%${page.search}%` } }
  ];
  const { rows, count } = await PartnerApplication.findAndCountAll({
    where,
    limit: page.limit,
    offset: page.offset,
    order: [['createdAt', 'DESC']]
  });
  return { dados: rows.map(serializeAdmin), paginacao: paginationMeta(page.page, page.limit, count) };
}

async function reviewApplication(id, reviewerId, input) {
  const application = await PartnerApplication.findByPk(id);
  if (!application) throw new HttpError(404, 'PARCERIA_NAO_ENCONTRADA', 'Solicitação de parceria não encontrada.');
  application.status = input.status;
  application.internalNotes = input.internalNotes || null;
  application.reviewedById = reviewerId;
  application.reviewedAt = new Date();
  await application.save();
  return serializeAdmin(application);
}

module.exports = { createApplication, listApplications, reviewApplication };

function serializeUser(user) {
  if (!user) return null;
  const value = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  return {
    id: value.id,
    nome: value.name,
    email: value.email,
    telefone: value.phone || null,
    documentoMascarado: value.documentCiphertext ? '••••••••' : null,
    perfil: value.role,
    situacao: value.status,
    criadoEm: value.createdAt
  };
}

function serializeShipment(shipment, { includePrivateAddress = false, includePrivateEvents = false } = {}) {
  if (!shipment) return null;
  const value = typeof shipment.get === 'function' ? shipment.get({ plain: true }) : shipment;
  const result = {
    id: value.id,
    codigoRastreio: value.trackingCode,
    modalidade: value.serviceType,
    situacao: value.status,
    pesoTotalKg: Number(value.totalWeight),
    valorEstimado: Number(value.totalPrice),
    moeda: value.currency,
    tarifaDemonstracao: Boolean(value.isDemoRate),
    previsaoEntrega: value.estimatedDeliveryAt || null,
    criadoEm: value.createdAt,
    pacotes: (value.packages || []).map((item) => ({
      id: item.id,
      alturaCm: Number(item.heightCm),
      larguraCm: Number(item.widthCm),
      comprimentoCm: Number(item.lengthCm),
      pesoKg: Number(item.weightKg),
      descricao: item.description || null
    })),
    eventos: (value.events || []).filter((item) => includePrivateEvents || item.isPublic)
      .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
      .map((item) => ({
        situacao: item.status,
        descricao: item.publicDescription,
        local: item.location || null,
        ocorridoEm: item.occurredAt,
        ...(includePrivateEvents ? { publico: Boolean(item.isPublic), observacaoInterna: item.privateNote || null, atorId: item.actorId || null } : {})
      }))
  };
  if (includePrivateAddress) {
    result.origem = { endereco: value.originAddress, cep: value.originZip };
    result.destino = { endereco: value.destinationAddress, cep: value.destinationZip };
  }
  return result;
}

module.exports = { serializeUser, serializeShipment };

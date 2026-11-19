const express = require('express');
const validate = require('../middleware/validate');
const { authenticate, requireRoles } = require('../middleware/auth');
const { authLimiter, publicFormLimiter } = require('../middleware/rate-limit');
const { querySchema } = require('../utils/pagination');
const { idParamsSchema, trackingParamsSchema } = require('../validators/params');
const { registerSchema, loginSchema, updateProfileSchema, adminUserUpdateSchema } = require('../validators/auth');
const { quoteSchema, createShipmentSchema, statusUpdateSchema, assignCourierSchema } = require('../validators/shipment');
const { courierApplicationSchema, pointApplicationSchema, reviewApplicationSchema } = require('../validators/partners');
const { createContactSchema, updateContactSchema } = require('../validators/contact');
const { tariffSchema } = require('../validators/tariff');
const auth = require('../controllers/auth.controller');
const users = require('../controllers/user.controller');
const shipments = require('../controllers/shipment.controller');
const partners = require('../controllers/partner.controller');
const contacts = require('../controllers/contact.controller');
const tariffs = require('../controllers/tariff.controller');

const router = express.Router();

router.post('/auth/login', authLimiter, validate(loginSchema), auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.post('/usuarios', authLimiter, validate(registerSchema), auth.register);
router.get('/usuarios/me', authenticate, auth.me);
router.patch('/usuarios/me', authenticate, validate(updateProfileSchema), users.updateMe);
router.get('/usuarios', authenticate, requireRoles('administrador'), validate(querySchema, 'query'), users.list);
router.patch('/usuarios/:id', authenticate, requireRoles('administrador'), validate(idParamsSchema, 'params'), validate(adminUserUpdateSchema), users.update);
router.delete('/usuarios/:id', authenticate, requireRoles('administrador'), validate(idParamsSchema, 'params'), users.deactivate);

router.post('/cotacoes', publicFormLimiter, validate(quoteSchema), shipments.quote);
router.post('/envios', authenticate, requireRoles('cliente'), validate(createShipmentSchema), shipments.create);
router.get('/envios/me', authenticate, requireRoles('cliente'), validate(querySchema, 'query'), shipments.listOwn);
router.get('/entregas/me', authenticate, requireRoles('entregador'), validate(querySchema, 'query'), shipments.listAssigned);
router.get('/envios', authenticate, requireRoles('administrador', 'operador'), validate(querySchema, 'query'), shipments.listAll);
router.get('/envios/:id', authenticate, validate(idParamsSchema, 'params'), shipments.detail);
router.patch('/envios/:id/cancelar', authenticate, requireRoles('cliente'), validate(idParamsSchema, 'params'), shipments.cancelOwn);
router.patch('/envios/:id/situacao', authenticate, requireRoles('administrador', 'operador', 'entregador'), validate(idParamsSchema, 'params'), validate(statusUpdateSchema), shipments.updateStatus);
router.patch('/envios/:id/entregador', authenticate, requireRoles('administrador', 'operador'), validate(idParamsSchema, 'params'), validate(assignCourierSchema), shipments.assignCourier);
router.get('/rastreio/:codigo', validate(trackingParamsSchema, 'params'), shipments.track);

router.post('/parcerias/entregadores', publicFormLimiter, validate(courierApplicationSchema), partners.applyCourier);
router.post('/parcerias/pontos-de-entrega', publicFormLimiter, validate(pointApplicationSchema), partners.applyPoint);
router.get('/admin/parcerias', authenticate, requireRoles('administrador', 'operador'), validate(querySchema, 'query'), partners.list);
router.patch('/admin/parcerias/:id', authenticate, requireRoles('administrador', 'operador'), validate(idParamsSchema, 'params'), validate(reviewApplicationSchema), partners.review);

router.post('/contato', publicFormLimiter, validate(createContactSchema), contacts.create);
router.get('/admin/contatos', authenticate, requireRoles('administrador', 'operador'), validate(querySchema, 'query'), contacts.list);
router.patch('/admin/contatos/:id', authenticate, requireRoles('administrador', 'operador'), validate(idParamsSchema, 'params'), validate(updateContactSchema), contacts.update);

router.get('/tarifas', tariffs.listPublic);
router.get('/admin/tarifas', authenticate, requireRoles('administrador'), tariffs.listAdmin);
router.put('/admin/tarifas', authenticate, requireRoles('administrador'), validate(tariffSchema), tariffs.upsert);
router.patch('/admin/tarifas/:id/desativar', authenticate, requireRoles('administrador'), validate(idParamsSchema, 'params'), tariffs.deactivate);

module.exports = router;

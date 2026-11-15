import { Router } from 'express';
import { ejecutar } from '../controllers/controlador.js';
import * as invitaciones from '../services/invitaciones.service.js';

const router = Router();
router.get('/', ejecutar((req) => invitaciones.listar(req.usuario.id)));
router.post('/', ejecutar((req) => invitaciones.crear(req.usuario.id, req.body?.email), 201));
router.patch('/:id/aceptar', ejecutar((req) => invitaciones.aceptar(req.params.id, req.usuario.id)));
router.delete('/:id', ejecutar((req) => invitaciones.eliminar(req.params.id, req.usuario.id)));
export default router;

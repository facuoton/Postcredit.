import { Router } from 'express';
import { ejecutar } from '../controllers/controlador.js';
import * as resenas from '../services/resenas.service.js';

const router = Router();
router.get('/', ejecutar((req) => resenas.listarPropias(req.usuario.id)));
router.get('/circulo/:usuarioId', ejecutar((req) => resenas.listarDeAmigo(req.usuario.id, req.params.usuarioId)));
router.get('/:id', ejecutar((req) => resenas.obtener(req.params.id, req.usuario.id)));
router.post('/', ejecutar((req) => resenas.crear(req.body || {}, req.usuario.id), 201));
router.patch('/:id', ejecutar((req) => resenas.editar(req.params.id, req.body || {}, req.usuario.id)));
router.delete('/:id', ejecutar((req) => resenas.eliminar(req.params.id, req.usuario.id)));
export default router;

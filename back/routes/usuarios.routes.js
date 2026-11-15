import { Router } from 'express';
import { ejecutar } from '../controllers/controlador.js';
import { pedirToken } from '../middlewares/autorizacion.js';
import * as usuarios from '../services/usuarios.service.js';

const router = Router();
router.post('/registro', ejecutar((req) => usuarios.registrar(req.body || {}), 201));
router.post('/login', ejecutar((req) => usuarios.login(req.body || {})));
router.get('/yo', pedirToken, ejecutar((req) => usuarios.obtener(req.usuario.id)));
export default router;

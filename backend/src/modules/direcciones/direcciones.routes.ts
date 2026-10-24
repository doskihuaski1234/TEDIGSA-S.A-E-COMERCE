import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { crearDireccion } from './direcciones.controller';

const router = Router();

router.use(authenticate);
router.post('/', crearDireccion);

export default router;
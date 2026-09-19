import { Router } from 'express';
import {
  crearOrden,
  getMisOrdenes,
  getOrdenById,
  getAllOrdenes,
  updateEstadoOrden,
} from './ordenes.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', crearOrden);
router.get('/mis-ordenes', getMisOrdenes);
router.get('/:id', getOrdenById);

// Admin
router.get('/', authorize('Administrador', 'Encargado de Ventas/Bodega'), getAllOrdenes);
router.patch('/:id/estado', authorize('Administrador', 'Encargado de Ventas/Bodega'), updateEstadoOrden);

export default router;

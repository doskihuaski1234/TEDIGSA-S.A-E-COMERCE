import { Router } from 'express';
import {
  crearOrden,
  getMisOrdenes,
  getOrdenById,
  getAllOrdenes,
  updateEstadoOrden,
  getConfiguracionConfirmacion,
  updateConfiguracionConfirmacion,
  editarPedidoAdmin,
  cancelarPedidoAdmin,
} from './ordenes.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', crearOrden);
router.get('/mis-ordenes', getMisOrdenes);
router.get(
  '/configuracion/confirmacion',
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  getConfiguracionConfirmacion
);
router.put(
  '/configuracion/confirmacion',
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  updateConfiguracionConfirmacion
);
router.get('/', authorize('Administrador', 'Encargado de Ventas/Bodega'), getAllOrdenes);
router.patch(
  '/:id/administracion',
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  editarPedidoAdmin
);
router.post(
  '/:id/cancelar',
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  cancelarPedidoAdmin
);
router.patch(
  '/:id/estado',
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  updateEstadoOrden
);
router.get('/:id', getOrdenById);

export default router;

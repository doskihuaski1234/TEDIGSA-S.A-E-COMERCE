import { Router } from 'express';
import {
  getCategorias,
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  updateInventario,
} from './catalogo.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();

// Públicos
router.get('/categorias', getCategorias);
router.get('/productos', getProductos);
router.get('/productos/:id', getProductoById);

// Admin / Encargado
router.post('/productos', authenticate, authorize('Administrador', 'Encargado de Ventas/Bodega'), createProducto);
router.put('/productos/:id', authenticate, authorize('Administrador', 'Encargado de Ventas/Bodega'), updateProducto);
router.patch('/productos/:id/inventario', authenticate, authorize('Administrador', 'Encargado de Ventas/Bodega'), updateInventario);

export default router;

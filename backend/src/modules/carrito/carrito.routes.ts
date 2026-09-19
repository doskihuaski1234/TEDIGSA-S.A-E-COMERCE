import { Router } from 'express';
import { getCarrito, addItem, updateItem, removeItem } from './carrito.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getCarrito);
router.post('/items', addItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', removeItem);

export default router;

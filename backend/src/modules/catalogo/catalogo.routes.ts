
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import prisma from '../../config/prisma';

import {
  getCategorias,
  getProductos,
  getProductosAdmin,
  getProductoById,
  createProducto,
  updateProducto,
  updateInventario,
  eliminarProducto,
} from './catalogo.controller';

import {
  authenticate,
  authorize,
} from '../../common/middleware/auth.middleware';

const router = Router();

const directorioImagenes = path.resolve(
  __dirname,
  '../../../uploads/productos'
);

const tiposImagenPermitidos: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const almacenamientoImagenes = multer.diskStorage({
  destination: (_req, _file, callback) => {
    try {
      mkdirSync(directorioImagenes, { recursive: true });
      callback(null, directorioImagenes);
    } catch (error) {
      callback(error as Error, directorioImagenes);
    }
  },
  filename: (_req, file, callback) => {
    const extension = tiposImagenPermitidos[file.mimetype];

    if (!extension) {
      callback(new Error('Formato no permitido. Utiliza JPG, PNG, WEBP o GIF.'), '');
      return;
    }

    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const subirImagen = multer({
  storage: almacenamientoImagenes,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!tiposImagenPermitidos[file.mimetype]) {
      callback(
        new Error('Formato no permitido. Utiliza JPG, PNG, WEBP o GIF.')
      );
      return;
    }

    callback(null, true);
  },
});

// Rutas públicas
router.get('/categorias', getCategorias);
router.get('/productos', getProductos);

router.get(
  '/productos/administracion',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  getProductosAdmin
);

router.get('/productos/:id', getProductoById);

// Rutas protegidas para administradores y encargados
router.post(
  '/productos',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  createProducto
);

router.put(
  '/productos/:id',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  updateProducto
);

router.patch(
  '/productos/:id/inventario',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  updateInventario
);

router.delete(
  '/productos/:id',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  eliminarProducto
);
// Cargar imagen de un producto existente
router.post(
  '/productos/:id/imagen',
  authenticate,
  authorize('Administrador', 'Encargado de Ventas/Bodega'),
  (req: Request, res: Response, next: NextFunction) => {
    subirImagen.single('imagen')(req, res, (error: any) => {
      if (!error) {
        next();
        return;
      }

      console.error('Error al recibir imagen del producto: - catalogo.routes.ts:124', error);

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: 'La imagen supera el límite permitido de 5 MB.',
          });
          return;
        }

        if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
          res.status(400).json({
            error: 'Solo puedes subir una imagen usando el campo "imagen".',
          });
          return;
        }
      }

      res.status(400).json({
        error:
          error.message ||
          'No se pudo recibir la imagen. Verifica el formato del archivo.',
      });
    });
  },
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({
          error: 'ID de producto inválido.',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          error: 'Selecciona una imagen para subir.',
        });
        return;
      }

      const imagenUrl = `${req.protocol}://${req.get('host')}/uploads/productos/${req.file.filename}`;

      const producto = await prisma.producto.update({
        where: {
          id_producto: id,
        },
        data: {
          imagen_url: imagenUrl,
        },
        select: {
          id_producto: true,
          nombre: true,
          imagen_url: true,
        },
      });

      res.json({
        mensaje: 'Imagen cargada correctamente.',
        producto,
      });
    } catch (error: any) {
      console.error('Error al guardar imagen del producto: - catalogo.routes.ts:188', error);

      if (error.code === 'P2025') {
        res.status(404).json({
          error: 'El producto no existe.',
        });
        return;
      }

      res.status(500).json({
        error: 'No se pudo guardar la imagen del producto.',
      });
    }
  }
);

export default router;

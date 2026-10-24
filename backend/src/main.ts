import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { getJwtSecret } from './config/jwt';
import authRoutes from './modules/auth/auth.routes';
import catalogoRoutes from './modules/catalogo/catalogo.routes';
import carritoRoutes from './modules/carrito/carrito.routes';
import direccionesRoutes from './modules/direcciones/direcciones.routes';
import ordenesRoutes from './modules/ordenes/ordenes.routes';
import chatRoutes from './routes/chat.routes';

dotenv.config();
getJwtSecret();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

app.use(express.json());

// Imágenes persistentes de productos almacenadas en backend/uploads.
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TEDIGSA E-Commerce API',
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/direcciones', direccionesRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/chat', chatRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
  });
});

// Error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor',
    });
  }
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log('======================================== - main.ts:68');
  console.log('TEDIGSA S.A.  ECommerce API - main.ts:69');
  console.log(`Puerto: ${PORT} - main.ts:70`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'} - main.ts:71`);
  console.log('Version: Alpha - main.ts:72');
  console.log('======================================== - main.ts:73');
});
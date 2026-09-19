import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import catalogoRoutes from './modules/catalogo/catalogo.routes';
import carritoRoutes from './modules/carrito/carrito.routes';
import ordenesRoutes from './modules/ordenes/ordenes.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TEDIGSA E-Commerce API',
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString(),
  });
});

// Rutas (simulando microservicios detrás de un API Gateway)
app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ordenes', ordenesRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   TEDIGSA S.A. — E-Commerce API              ║
  ║   Puerto: ${PORT}                              ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}                   ║
  ║   Versión: Alpha                             ║
  ╚══════════════════════════════════════════════╝
  `);
});

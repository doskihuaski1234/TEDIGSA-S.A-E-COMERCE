import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TEDIGSA database... - seed.ts:7');

  // =========================================================
  // ROLES
  // =========================================================

  const rolCliente = await prisma.rol.upsert({
    where: { id_rol: 1 },
    update: {
      nombre: 'Cliente',
      descripcion: 'Usuario final de la plataforma',
    },
    create: {
      id_rol: 1,
      nombre: 'Cliente',
      descripcion: 'Usuario final de la plataforma',
    },
  });

  const rolAdmin = await prisma.rol.upsert({
    where: { id_rol: 2 },
    update: {
      nombre: 'Administrador',
      descripcion: 'Administrador total del sistema',
    },
    create: {
      id_rol: 2,
      nombre: 'Administrador',
      descripcion: 'Administrador total del sistema',
    },
  });

  const rolEncargado = await prisma.rol.upsert({
    where: { id_rol: 3 },
    update: {
      nombre: 'Encargado de Ventas/Bodega',
      descripcion: 'Gestión de catálogo, inventario y órdenes',
    },
    create: {
      id_rol: 3,
      nombre: 'Encargado de Ventas/Bodega',
      descripcion: 'Gestión de catálogo, inventario y órdenes',
    },
  });

  // =========================================================
  // USUARIO ADMINISTRADOR
  // =========================================================

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await prisma.usuario.upsert({
    where: {
      email: 'admin@tedigsa.net',
    },
    update: {
      nombre: 'Administrador TEDIGSA',
      telefono: '50212345678',
      password_hash: passwordHash,
      id_rol: rolAdmin.id_rol,
    },
    create: {
      nombre: 'Administrador TEDIGSA',
      email: 'admin@tedigsa.net',
      password_hash: passwordHash,
      telefono: '50212345678',
      id_rol: rolAdmin.id_rol,
    },
  });

  // =========================================================
  // USUARIO CLIENTE DE PRUEBA
  // =========================================================

  const clienteHash = await bcrypt.hash('Cliente123!', 12);

  await prisma.usuario.upsert({
    where: {
      email: 'cliente@example.com',
    },
    update: {
      nombre: 'Cliente Demo',
      telefono: '50287654321',
      password_hash: clienteHash,
      id_rol: rolCliente.id_rol,
    },
    create: {
      nombre: 'Cliente Demo',
      email: 'cliente@example.com',
      password_hash: clienteHash,
      telefono: '50287654321',
      id_rol: rolCliente.id_rol,
    },
  });

  // =========================================================
  // CATEGORÍAS
  // =========================================================

  const categorias = [
    {
      nombre: 'CCTV y Alarmas',
      descripcion: 'Sistemas de videovigilancia y alarmas',
    },
    {
      nombre: 'Smart Home',
      descripcion: 'Dispositivos de automatización del hogar',
    },
    {
      nombre: 'Control de Acceso',
      descripcion: 'Cerraduras biométricas y control de acceso',
    },
    {
      nombre: 'Instalaciones Eléctricas',
      descripcion: 'Material y servicios eléctricos',
    },
  ];

  const categoriasCreadas: Record<string, number> = {};

  for (const categoria of categorias) {
    const existente = await prisma.categoria.findFirst({
      where: {
        nombre: categoria.nombre,
      },
    });

    const resultado =
      existente ??
      (await prisma.categoria.create({
        data: categoria,
      }));

    categoriasCreadas[categoria.nombre] = resultado.id_categoria;
  }

  // =========================================================
  // PROVEEDOR
  // =========================================================

  let proveedor = await prisma.proveedor.findFirst({
    where: {
      nit: '1234567-8',
    },
  });

  if (!proveedor) {
    proveedor = await prisma.proveedor.create({
      data: {
        nombre: 'Tech Security GT',
        nit: '1234567-8',
        contacto: 'ventas@techsecurity.gt',
        estado: 'Activo',
      },
    });
  }

  // =========================================================
  // PRODUCTOS
  // =========================================================

  const productos = [
    {
      nombre: 'Cámara IP Domo 4MP Visión Nocturna',
      descripcion:
        'Incluye soporte, cableado y garantía de 1 año. Resolución 4MP, visión nocturna IR.',
      sku: 'CAM-IP-4MP-001',
      tipo: 'Producto fisico',
      precio: 649.0,
      categoria: 'CCTV y Alarmas',
      cantidad: 25,
    },
    {
      nombre: 'Kit de Alarma Inalámbrica',
      descripcion:
        'Kit completo con panel, sensores de puerta/ventana y control remoto.',
      sku: 'ALM-KIT-WL-001',
      tipo: 'Producto fisico',
      precio: 1250.0,
      categoria: 'CCTV y Alarmas',
      cantidad: 15,
    },
    {
      nombre: 'Cerradura Biométrica',
      descripcion:
        'Cerradura inteligente con huella digital, código y llave de emergencia.',
      sku: 'ACC-BIO-001',
      tipo: 'Producto fisico',
      precio: 895.0,
      categoria: 'Control de Acceso',
      cantidad: 12,
    },
    {
      nombre: 'Panel Smart Home',
      descripcion:
        'Hub central para control de dispositivos inteligentes del hogar.',
      sku: 'SH-PANEL-001',
      tipo: 'Producto fisico',
      precio: 1890.0,
      categoria: 'Smart Home',
      cantidad: 8,
    },
    {
      nombre: 'Servicio de Instalación CCTV',
      descripcion:
        'Instalación profesional de sistema de cámaras (hasta 4 cámaras).',
      sku: 'SRV-INST-CCTV',
      tipo: 'Servicio de instalacion',
      precio: 350.0,
      categoria: 'CCTV y Alarmas',
      cantidad: 999,
    },
  ];

  for (const producto of productos) {
    const id_categoria = categoriasCreadas[producto.categoria];

    const productoExistente = await prisma.producto.findUnique({
      where: {
        sku: producto.sku,
      },
    });

    if (!productoExistente) {
      await prisma.producto.create({
        data: {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          sku: producto.sku,
          tipo: producto.tipo,
          precio: producto.precio,
          id_categoria,
          id_proveedor: producto.sku === 'SRV-INST-CCTV'
            ? undefined
            : proveedor.id_proveedor,
          inventario: {
            create: {
              cantidad_disponible: producto.cantidad,
            },
          },
        },
      });
    }
  }

  // =========================================================
  // CUPÓN
  // =========================================================

  const cuponExistente = await prisma.cupon.findUnique({
    where: {
      codigo: 'TEDIGSA10',
    },
  });

  if (!cuponExistente) {
    await prisma.cupon.create({
      data: {
        codigo: 'TEDIGSA10',
        tipo: 'Porcentaje',
        valor: 10,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        estado: 'Activo',
      },
    });
  }

  console.log('');
  console.log('======================================== - seed.ts:276');
  console.log('TEDIGSA  SEED COMPLETADO - seed.ts:277');
  console.log('======================================== - seed.ts:278');
  console.log('Admin: admin@tedigsa.net - seed.ts:279');
  console.log('Cliente: cliente@example.com - seed.ts:280');
  console.log('======================================== - seed.ts:281');
}

main()
  .catch((error) => {
    console.error('❌ Error ejecutando el seed: - seed.ts:286');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
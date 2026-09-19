import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TEDIGSA database...');

  // Roles
  const rolCliente = await prisma.rol.upsert({
    where: { id_rol: 1 },
    update: {},
    create: { nombre: 'Cliente', descripcion: 'Usuario final de la plataforma' },
  });

  const rolAdmin = await prisma.rol.upsert({
    where: { id_rol: 2 },
    update: {},
    create: { nombre: 'Administrador', descripcion: 'Administrador total del sistema' },
  });

  const rolEncargado = await prisma.rol.upsert({
    where: { id_rol: 3 },
    update: {},
    create: { nombre: 'Encargado de Ventas/Bodega', descripcion: 'Gestión de catálogo, inventario y órdenes' },
  });

  // Usuario Admin
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  await prisma.usuario.upsert({
    where: { email: 'admin@tedigsa.net' },
    update: {},
    create: {
      nombre: 'Administrador TEDIGSA',
      email: 'admin@tedigsa.net',
      password_hash: passwordHash,
      telefono: '50212345678',
      id_rol: rolAdmin.id_rol,
    },
  });

  // Usuario Cliente de prueba
  const clienteHash = await bcrypt.hash('Cliente123!', 12);
  await prisma.usuario.upsert({
    where: { email: 'cliente@example.com' },
    update: {},
    create: {
      nombre: 'Cliente Demo',
      email: 'cliente@example.com',
      password_hash: clienteHash,
      telefono: '50287654321',
      id_rol: rolCliente.id_rol,
    },
  });

  // Categorías
  const catCCTV = await prisma.categoria.create({
    data: { nombre: 'CCTV y Alarmas', descripcion: 'Sistemas de videovigilancia y alarmas' },
  });
  const catSmart = await prisma.categoria.create({
    data: { nombre: 'Smart Home', descripcion: 'Dispositivos de automatización del hogar' },
  });
  const catAcceso = await prisma.categoria.create({
    data: { nombre: 'Control de Acceso', descripcion: 'Cerraduras biométricas y control de acceso' },
  });
  const catElectrico = await prisma.categoria.create({
    data: { nombre: 'Instalaciones Eléctricas', descripcion: 'Material y servicios eléctricos' },
  });

  // Proveedor
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: 'Tech Security GT',
      nit: '1234567-8',
      contacto: 'ventas@techsecurity.gt',
      estado: 'Activo',
    },
  });

  // Productos de ejemplo (basados en el prototipo)
  const productos = [
    {
      nombre: 'Cámara IP Domo 4MP Visión Nocturna',
      descripcion: 'Incluye soporte, cableado y garantía de 1 año. Resolución 4MP, visión nocturna IR.',
      sku: 'CAM-IP-4MP-001',
      tipo: 'Producto fisico',
      precio: 649.0,
      id_categoria: catCCTV.id_categoria,
      id_proveedor: proveedor.id_proveedor,
      cantidad: 25,
    },
    {
      nombre: 'Kit de Alarma Inalámbrica',
      descripcion: 'Kit completo con panel, sensores de puerta/ventana y control remoto.',
      sku: 'ALM-KIT-WL-001',
      tipo: 'Producto fisico',
      precio: 1250.0,
      id_categoria: catCCTV.id_categoria,
      id_proveedor: proveedor.id_proveedor,
      cantidad: 15,
    },
    {
      nombre: 'Cerradura Biométrica',
      descripcion: 'Cerradura inteligente con huella digital, código y llave de emergencia.',
      sku: 'ACC-BIO-001',
      tipo: 'Producto fisico',
      precio: 895.0,
      id_categoria: catAcceso.id_categoria,
      id_proveedor: proveedor.id_proveedor,
      cantidad: 12,
    },
    {
      nombre: 'Panel Smart Home',
      descripcion: 'Hub central para control de dispositivos inteligentes del hogar.',
      sku: 'SH-PANEL-001',
      tipo: 'Producto fisico',
      precio: 1890.0,
      id_categoria: catSmart.id_categoria,
      id_proveedor: proveedor.id_proveedor,
      cantidad: 8,
    },
    {
      nombre: 'Servicio de Instalación CCTV',
      descripcion: 'Instalación profesional de sistema de cámaras (hasta 4 cámaras).',
      sku: 'SRV-INST-CCTV',
      tipo: 'Servicio de instalacion',
      precio: 450.0,
      id_categoria: catCCTV.id_categoria,
      cantidad: 999,
    },
  ];

  for (const p of productos) {
    const { cantidad, ...data } = p;
    await prisma.producto.create({
      data: {
        ...data,
        inventario: {
          create: { cantidad_disponible: cantidad },
        },
      },
    });
  }

  // Cupón de ejemplo
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

  console.log('✅ Seed completado');
  console.log('   Admin: admin@tedigsa.net / Admin123!');
  console.log('   Cliente: cliente@example.com / Cliente123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

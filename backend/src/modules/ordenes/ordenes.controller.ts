import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

const IVA_RATE = 0.12; // Guatemala 12%

export const crearOrden = async (req: AuthRequest, res: Response) => {
  try {
    const { id_direccion, id_cupon, metodo_pago } = req.body;

    const carrito = await prisma.carritoCompras.findFirst({
      where: { id_usuario: req.user!.id_usuario, estado: 'Activo' },
      include: {
        items: {
          include: { producto: { include: { inventario: true } } },
        },
      },
    });

    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Validar stock real
    for (const item of carrito.items) {
      const disponible = item.producto.inventario?.cantidad_disponible ?? 0;
      if (disponible < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para: ${item.producto.nombre}`,
        });
      }
    }

    let subtotal = carrito.items.reduce(
      (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
      0
    );

    let descuento = 0;
    if (id_cupon) {
      const cupon = await prisma.cupon.findUnique({ where: { id_cupon } });
      if (cupon && cupon.estado === 'Activo') {
        if (cupon.tipo === 'Porcentaje') {
          descuento = subtotal * (Number(cupon.valor) / 100);
        } else {
          descuento = Number(cupon.valor);
        }
      }
    }

    const base = Math.max(subtotal - descuento, 0);
    const impuestos = base * IVA_RATE;
    const total = base + impuestos;

    // Crear orden + detalles + pago + factura en transacción
    const orden = await prisma.$transaction(async (tx) => {
      const nuevaOrden = await tx.orden.create({
        data: {
          id_usuario: req.user!.id_usuario,
          id_direccion,
          id_cupon: id_cupon || null,
          subtotal,
          impuestos,
          total,
          estado: 'Pendiente',
          detalles: {
            create: carrito.items.map((item) => ({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: item.producto.precio,
              subtotal: Number(item.producto.precio) * item.cantidad,
            })),
          },
        },
        include: { detalles: true },
      });

      // Actualizar inventario (descontar stock y liberar reserva)
      for (const item of carrito.items) {
        await tx.inventario.update({
          where: { id_producto: item.id_producto },
          data: {
            cantidad_disponible: { decrement: item.cantidad },
            cantidad_reservada: { decrement: item.cantidad },
          },
        });
      }

      // Marcar carrito como convertido
      await tx.carritoCompras.update({
        where: { id_carrito: carrito.id_carrito },
        data: { estado: 'Convertido en orden' },
      });

      // Crear registro de pago (pendiente de confirmación de pasarela)
      await tx.pago.create({
        data: {
          id_orden: nuevaOrden.id_orden,
          metodo_pago: metodo_pago || 'Tarjeta',
          monto: total,
          estado: 'Pendiente',
        },
      });

      // Crear factura FEL pendiente
      await tx.facturaFEL.create({
        data: {
          id_orden: nuevaOrden.id_orden,
          estado: 'Pendiente',
        },
      });

      return nuevaOrden;
    });

    // Simulación de respuesta de pasarela (en producción se llama a la API real)
    // Aquí se marcaría el pago como Aprobado y se generaría el DTE/UUID SAT

    res.status(201).json({
      message: 'Orden creada exitosamente',
      orden,
      total,
      impuestos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
};

export const getMisOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const ordenes = await prisma.orden.findMany({
      where: { id_usuario: req.user!.id_usuario },
      include: {
        detalles: { include: { producto: { select: { nombre: true, imagen_url: true } } } },
        pago: true,
        factura: true,
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

export const getOrdenById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const orden = await prisma.orden.findUnique({
      where: { id_orden: id },
      include: {
        detalles: { include: { producto: true } },
        pago: true,
        factura: true,
        direccion: true,
        usuario: { select: { nombre: true, email: true } },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Solo el dueño o admin puede ver
    if (orden.id_usuario !== req.user!.id_usuario && !['Administrador', 'Encargado de Ventas/Bodega'].includes(req.user!.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

// Admin: listar todas las órdenes
export const getAllOrdenes = async (req: AuthRequest, res: Response) => {
  try {
    const { estado, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (estado) where.estado = estado;

    const [ordenes, total] = await Promise.all([
      prisma.orden.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true } },
          pago: { select: { estado: true, metodo_pago: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { fecha: 'desc' },
      }),
      prisma.orden.count({ where }),
    ]);

    res.json({ data: ordenes, meta: { total, page: parseInt(page as string) } });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
};

export const updateEstadoOrden = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const validStates = ['Pendiente', 'Pagada', 'En preparacion', 'Enviada', 'Entregada', 'Cancelada'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const orden = await prisma.orden.update({
      where: { id_orden: id },
      data: { estado },
    });

    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

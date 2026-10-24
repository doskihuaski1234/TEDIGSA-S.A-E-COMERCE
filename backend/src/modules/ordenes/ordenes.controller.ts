import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

const IVA_RATE = 0.12; // Guatemala 12%
const CONFIRMACION_CONFIG_KEY = 'confirmacion_automatica_pedidos';

class PedidoAdminError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

const responderErrorPedido = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof PedidoAdminError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
};

export const crearOrden = async (req: AuthRequest, res: Response) => {
  try {
    const { id_direccion, id_cupon, metodo_pago } = req.body;

    if (!['Contra entrega', 'Transferencia bancaria'].includes(metodo_pago)) {
      return res.status(400).json({
        error: 'Este método de pago no está habilitado. No se registró el pedido.',
      });
    }

    const idDireccion = Number(id_direccion);
    if (!Number.isSafeInteger(idDireccion) || idDireccion <= 0) {
      return res.status(400).json({ error: 'Dirección de entrega inválida' });
    }

    const direccion = await prisma.direccion.findFirst({
      where: {
        id_direccion: idDireccion,
        id_usuario: req.user!.id_usuario,
      },
      select: { id_direccion: true },
    });

    if (!direccion) {
      return res.status(404).json({ error: 'Dirección de entrega no encontrada' });
    }

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
    const configuracionConfirmacion =
      await prisma.configuracionSistema.findUnique({
        where: { clave: CONFIRMACION_CONFIG_KEY },
        select: { valor: true },
      });
    const confirmarAutomaticamente =
      configuracionConfirmacion?.valor === 'automatico';

    // Crear orden + detalles + pago + factura en transacción
    const orden = await prisma.$transaction(async (tx) => {
      const nuevaOrden = await tx.orden.create({
        data: {
          id_usuario: req.user!.id_usuario,
          id_direccion: idDireccion,
          id_cupon: id_cupon || null,
          subtotal,
          impuestos,
          total,
          estado: confirmarAutomaticamente ? 'Confirmada' : 'Pendiente',
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
    const estado = typeof req.query.estado === 'string' ? req.query.estado : '';
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({ error: 'Paginación inválida' });
    }

    const where: { estado?: string } = {};
    if (estado) where.estado = estado;

    const [ordenes, total] = await Promise.all([
      prisma.orden.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true } },
          direccion: true,
          detalles: {
            include: {
              producto: { select: { nombre: true } },
            },
          },
          pago: { select: { estado: true, metodo_pago: true, monto: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fecha: 'desc' },
      }),
      prisma.orden.count({ where }),
    ]);

    res.json({
      data: ordenes,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error al listar órdenes:', error);
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
};

export const getConfiguracionConfirmacion = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const configuracion = await prisma.configuracionSistema.findUnique({
      where: { clave: CONFIRMACION_CONFIG_KEY },
      select: { valor: true },
    });

    res.json({ automatico: configuracion?.valor === 'automatico' });
  } catch (error) {
    console.error('Error al consultar la configuración de pedidos:', error);
    res.status(500).json({ error: 'Error al consultar la configuración de pedidos' });
  }
};

export const editarPedidoAdmin = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const { direccion, items } = req.body ?? {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }
  if (
    !direccion ||
    typeof direccion.calle !== 'string' ||
    !direccion.calle.trim() ||
    typeof direccion.ciudad !== 'string' ||
    !direccion.ciudad.trim() ||
    typeof direccion.departamento !== 'string' ||
    !direccion.departamento.trim() ||
    direccion.calle.trim().length > 150 ||
    direccion.ciudad.trim().length > 80 ||
    direccion.departamento.trim().length > 80 ||
    (direccion.codigo_postal != null &&
      String(direccion.codigo_postal).trim().length > 10)
  ) {
    return res.status(400).json({ error: 'La dirección de entrega no es válida' });
  }
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50 ||
    items.some(
      (item) =>
        !Number.isSafeInteger(item?.id_producto) ||
        item.id_producto <= 0 ||
        !Number.isSafeInteger(item?.cantidad) ||
        item.cantidad <= 0 ||
        item.cantidad > 10000
    ) ||
    new Set(items.map((item: { id_producto: number }) => item.id_producto)).size !==
      items.length
  ) {
    return res.status(400).json({
      error: 'Incluye artículos válidos, sin productos repetidos y con cantidad mayor que cero',
    });
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const actual = await tx.orden.findUnique({
        where: { id_orden: id },
        include: { detalles: true, pago: true, cupon: true, direccion: true },
      });
      if (!actual) throw new PedidoAdminError('Pedido no encontrado', 404);
      if (!['Pendiente', 'Confirmada'].includes(actual.estado)) {
        throw new PedidoAdminError(
          'Solo se pueden editar pedidos pendientes o confirmados que aún no avanzan a preparación',
          409
        );
      }
      if (actual.pago && actual.pago.estado !== 'Pendiente') {
        throw new PedidoAdminError(
          'No se puede editar un pedido cuyo pago ya fue procesado',
          409
        );
      }

      const idsProducto = items.map(
        (item: { id_producto: number; cantidad: number }) => item.id_producto
      );
      const productos = await tx.producto.findMany({
        where: { id_producto: { in: idsProducto } },
        include: { inventario: true },
      });
      if (productos.length !== idsProducto.length) {
        throw new PedidoAdminError('Uno o más productos ya no existen', 400);
      }

      for (const producto of productos) {
        const pedidoExistente = actual.detalles.some(
          (detalle) => detalle.id_producto === producto.id_producto
        );
        if (!pedidoExistente && producto.estado !== 'Publicado') {
          throw new PedidoAdminError(
            `El producto "${producto.nombre}" no está publicado y no se puede agregar`,
            400
          );
        }
      }

      const cantidadesAnteriores = new Map<number, number>();
      for (const detalle of actual.detalles) {
        cantidadesAnteriores.set(
          detalle.id_producto,
          (cantidadesAnteriores.get(detalle.id_producto) ?? 0) + detalle.cantidad
        );
      }
      const cantidadesNuevas = new Map<number, number>(
        items.map(
          (item: { id_producto: number; cantidad: number }) => [
            item.id_producto,
            item.cantidad,
          ]
        )
      );
      const cantidadesAjustadas = new Map([
        ...cantidadesAnteriores,
        ...cantidadesNuevas,
      ]);

      for (const [idProducto, cantidadAnterior] of cantidadesAjustadas) {
        const cantidadNueva = cantidadesNuevas.get(idProducto) ?? 0;
        const cambio = cantidadNueva - cantidadAnterior;
        if (cambio > 0) {
          const inventario = await tx.inventario.updateMany({
            where: {
              id_producto: idProducto,
              cantidad_disponible: { gte: cambio },
            },
            data: { cantidad_disponible: { decrement: cambio } },
          });
          if (inventario.count === 0) {
            const producto = productos.find((item) => item.id_producto === idProducto);
            throw new PedidoAdminError(
              `No hay existencias suficientes para "${producto?.nombre ?? 'el producto'}"`,
              409
            );
          }
        } else if (cambio < 0) {
          const inventario = await tx.inventario.updateMany({
            where: { id_producto: idProducto },
            data: { cantidad_disponible: { increment: Math.abs(cambio) } },
          });
          if (inventario.count === 0) {
            throw new PedidoAdminError(
              'No se encontró el inventario de un producto del pedido',
              409
            );
          }
        }
      }

      const productosPorId = new Map(
        productos.map((producto) => [producto.id_producto, producto])
      );
      const preciosAnteriores = new Map(
        actual.detalles.map((detalle) => [
          detalle.id_producto,
          detalle.precio_unitario,
        ])
      );
      const subtotal = items.reduce(
        (
          suma: number,
          item: { id_producto: number; cantidad: number }
        ) =>
          suma +
          Number(
            preciosAnteriores.get(item.id_producto) ??
              productosPorId.get(item.id_producto)!.precio
          ) * item.cantidad,
        0
      );
      let descuento = 0;
      if (actual.cupon?.estado === 'Activo') {
        descuento =
          actual.cupon.tipo === 'Porcentaje'
            ? subtotal * (Number(actual.cupon.valor) / 100)
            : Number(actual.cupon.valor);
      }
      const base = Math.max(subtotal - descuento, 0);
      const impuestos = base * IVA_RATE;
      const total = base + impuestos;

      const direccionActualizada =
        actual.direccion.calle !== direccion.calle.trim() ||
        actual.direccion.ciudad !== direccion.ciudad.trim() ||
        actual.direccion.departamento !== direccion.departamento.trim() ||
        (actual.direccion.codigo_postal ?? '') !==
          String(direccion.codigo_postal ?? '').trim();

      const direccionNueva = direccionActualizada
        ? await tx.direccion.create({
            data: {
              id_usuario: actual.id_usuario,
              calle: direccion.calle.trim(),
              ciudad: direccion.ciudad.trim(),
              departamento: direccion.departamento.trim(),
              codigo_postal: direccion.codigo_postal
                ? String(direccion.codigo_postal).trim()
                : null,
              tipo: 'Entrega',
            },
          })
        : null;

      await tx.detalleOrden.deleteMany({ where: { id_orden: id } });
      const actualizado = await tx.orden.update({
        where: { id_orden: id },
        data: {
          ...(direccionNueva ? { id_direccion: direccionNueva.id_direccion } : {}),
          subtotal,
          impuestos,
          total,
          detalles: {
            create: items.map(
              (item: { id_producto: number; cantidad: number }) => {
                const precio =
                  preciosAnteriores.get(item.id_producto) ??
                  productosPorId.get(item.id_producto)!.precio;
                return {
                  id_producto: item.id_producto,
                  cantidad: item.cantidad,
                  precio_unitario: precio,
                  subtotal: Number(precio) * item.cantidad,
                };
              }
            ),
          },
        },
        include: {
          detalles: { include: { producto: { select: { nombre: true } } } },
          direccion: true,
        },
      });

      if (actual.pago) {
        await tx.pago.update({
          where: { id_orden: id },
          data: { monto: total },
        });
      }

      return actualizado;
    });

    return res.json({ message: 'Pedido actualizado correctamente', pedido });
  } catch (error) {
    return responderErrorPedido(res, error, 'Error al actualizar el pedido');
  }
};

export const cancelarPedidoAdmin = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Número de pedido inválido' });
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const actual = await tx.orden.findUnique({
        where: { id_orden: id },
        include: { detalles: true, pago: true },
      });
      if (!actual) throw new PedidoAdminError('Pedido no encontrado', 404);
      if (!['Pendiente', 'Confirmada'].includes(actual.estado)) {
        throw new PedidoAdminError(
          'Solo se pueden cancelar pedidos pendientes o confirmados antes de preparación',
          409
        );
      }
      if (actual.pago && actual.pago.estado !== 'Pendiente') {
        throw new PedidoAdminError(
          'No se puede cancelar automáticamente un pago ya procesado; gestiona primero el reembolso',
          409
        );
      }

      const actualizado = await tx.orden.updateMany({
        where: {
          id_orden: id,
          estado: { in: ['Pendiente', 'Confirmada'] },
        },
        data: { estado: 'Cancelada' },
      });
      if (actualizado.count === 0) {
        throw new PedidoAdminError('El pedido ya no se puede cancelar', 409);
      }

      for (const detalle of actual.detalles) {
        const inventario = await tx.inventario.updateMany({
          where: { id_producto: detalle.id_producto },
          data: { cantidad_disponible: { increment: detalle.cantidad } },
        });
        if (inventario.count === 0) {
          throw new PedidoAdminError(
            'No se encontró el inventario de un producto; no se canceló el pedido',
            409
          );
        }
      }

      if (actual.pago) {
        await tx.pago.update({
          where: { id_orden: id },
          data: { estado: 'Cancelado' },
        });
      }

      return tx.orden.findUnique({ where: { id_orden: id } });
    });

    return res.json({ message: 'Pedido cancelado y existencias restauradas', pedido });
  } catch (error) {
    return responderErrorPedido(res, error, 'Error al cancelar el pedido');
  }
};

export const updateConfiguracionConfirmacion = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { automatico } = req.body;
    if (typeof automatico !== 'boolean') {
      return res.status(400).json({ error: 'El modo automático debe ser verdadero o falso' });
    }

    await prisma.configuracionSistema.upsert({
      where: { clave: CONFIRMACION_CONFIG_KEY },
      create: {
        clave: CONFIRMACION_CONFIG_KEY,
        valor: automatico ? 'automatico' : 'manual',
      },
      update: { valor: automatico ? 'automatico' : 'manual' },
    });

    res.json({ automatico });
  } catch (error) {
    console.error('Error al guardar la configuración de pedidos:', error);
    res.status(500).json({ error: 'Error al guardar la configuración de pedidos' });
  }
};

export const updateEstadoOrden = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Número de pedido inválido' });
    }

    const validStates = [
      'Pendiente',
      'Confirmada',
      'Pagada',
      'En preparacion',
      'Enviada',
      'Entregada',
      'Cancelada',
    ];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    if (estado === 'Confirmada') {
      const result = await prisma.orden.updateMany({
        where: { id_orden: id, estado: 'Pendiente' },
        data: { estado },
      });

      if (result.count === 0) {
        const orden = await prisma.orden.findUnique({
          where: { id_orden: id },
          select: { id_orden: true },
        });
        if (!orden) {
          return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        return res.status(409).json({ error: 'El pedido ya no está pendiente de confirmación' });
      }
      const orden = await prisma.orden.findUnique({ where: { id_orden: id } });
      if (!orden) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      return res.json(orden);
    }

    const orden = await prisma.orden.update({
        where: { id_orden: id },
        data: { estado },
      });

    res.json(orden);
  } catch (error) {
    console.error('Error al actualizar el estado del pedido:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

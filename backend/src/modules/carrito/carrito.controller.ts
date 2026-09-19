import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

export const getCarrito = async (req: AuthRequest, res: Response) => {
  try {
    let carrito = await prisma.carritoCompras.findFirst({
      where: { id_usuario: req.user!.id_usuario, estado: 'Activo' },
      include: {
        items: {
          include: {
            producto: {
              include: {
                inventario: { select: { cantidad_disponible: true } },
              },
            },
          },
        },
      },
    });

    if (!carrito) {
      carrito = await prisma.carritoCompras.create({
        data: { id_usuario: req.user!.id_usuario },
        include: { items: { include: { producto: true } } },
      });
    }

    const subtotal = carrito.items.reduce(
      (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
      0
    );

    res.json({ ...carrito, subtotal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
};

export const addItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id_producto, cantidad = 1 } = req.body;

    const producto = await prisma.producto.findUnique({
      where: { id_producto },
      include: { inventario: true },
    });

    if (!producto || producto.estado !== 'Publicado') {
      return res.status(404).json({ error: 'Producto no disponible' });
    }

    if (producto.inventario && producto.inventario.cantidad_disponible < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    let carrito = await prisma.carritoCompras.findFirst({
      where: { id_usuario: req.user!.id_usuario, estado: 'Activo' },
    });

    if (!carrito) {
      carrito = await prisma.carritoCompras.create({
        data: { id_usuario: req.user!.id_usuario },
      });
    }

    const existing = await prisma.carritoItem.findFirst({
      where: { id_carrito: carrito.id_carrito, id_producto },
    });

    if (existing) {
      await prisma.carritoItem.update({
        where: { id_carrito_item: existing.id_carrito_item },
        data: { cantidad: existing.cantidad + cantidad },
      });
    } else {
      await prisma.carritoItem.create({
        data: {
          id_carrito: carrito.id_carrito,
          id_producto,
          cantidad,
        },
      });
    }

    // Reservar stock
    if (producto.inventario) {
      await prisma.inventario.update({
        where: { id_producto },
        data: {
          cantidad_reservada: { increment: cantidad },
        },
      });
    }

    const updated = await getCarritoData(req.user!.id_usuario);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const id_carrito_item = parseInt(req.params.id);
    const { cantidad } = req.body;

    const item = await prisma.carritoItem.findUnique({
      where: { id_carrito_item },
      include: { carrito: true, producto: { include: { inventario: true } } },
    });

    if (!item || item.carrito.id_usuario !== req.user!.id_usuario) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    if (cantidad <= 0) {
      await prisma.carritoItem.delete({ where: { id_carrito_item } });
    } else {
      const diff = cantidad - item.cantidad;
      await prisma.carritoItem.update({
        where: { id_carrito_item },
        data: { cantidad },
      });

      if (item.producto.inventario && diff !== 0) {
        await prisma.inventario.update({
          where: { id_producto: item.id_producto },
          data: { cantidad_reservada: { increment: diff } },
        });
      }
    }

    const updated = await getCarritoData(req.user!.id_usuario);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ítem' });
  }
};

export const removeItem = async (req: AuthRequest, res: Response) => {
  try {
    const id_carrito_item = parseInt(req.params.id);

    const item = await prisma.carritoItem.findUnique({
      where: { id_carrito_item },
      include: { carrito: true },
    });

    if (!item || item.carrito.id_usuario !== req.user!.id_usuario) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    await prisma.carritoItem.delete({ where: { id_carrito_item } });

    // Liberar reserva
    await prisma.inventario.update({
      where: { id_producto: item.id_producto },
      data: { cantidad_reservada: { decrement: item.cantidad } },
    });

    const updated = await getCarritoData(req.user!.id_usuario);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ítem' });
  }
};

async function getCarritoData(id_usuario: number) {
  const carrito = await prisma.carritoCompras.findFirst({
    where: { id_usuario, estado: 'Activo' },
    include: {
      items: {
        include: {
          producto: {
            include: { inventario: { select: { cantidad_disponible: true } } },
          },
        },
      },
    },
  });

  if (!carrito) return null;

  const subtotal = carrito.items.reduce(
    (acc, item) => acc + Number(item.producto.precio) * item.cantidad,
    0
  );

  return { ...carrito, subtotal };
}

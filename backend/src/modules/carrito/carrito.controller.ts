import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

const carritoInclude = {
  items: {
    include: {
      producto: {
        include: {
          inventario: {
            select: {
              cantidad_disponible: true,
              cantidad_reservada: true,
            },
          },
        },
      },
    },
  },
} as const;

export const getCarrito = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
      });
    }

    const carrito = await obtenerOCrearCarrito(id_usuario);

    return res.status(200).json(
      construirRespuestaCarrito(carrito)
    );
  } catch (error) {
    console.error('Error al obtener carrito: - carrito.controller.ts:41', error);

    return res.status(500).json({
      error: 'Error al obtener carrito',
    });
  }
};

export const addItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
      });
    }

    const id_producto = Number(req.body.id_producto);
    const cantidad = Number(req.body.cantidad ?? 1);

    if (
      !Number.isInteger(id_producto) ||
      id_producto <= 0
    ) {
      return res.status(400).json({
        error: 'El id_producto debe ser válido',
      });
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return res.status(400).json({
        error: 'La cantidad debe ser un entero mayor que 0',
      });
    }

    const producto = await prisma.producto.findUnique({
      where: {
        id_producto,
      },
      include: {
        inventario: true,
      },
    });

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      });
    }

    if (producto.estado !== 'Publicado') {
      return res.status(400).json({
        error: 'El producto no está disponible',
      });
    }

    const carrito = await obtenerOCrearCarrito(id_usuario);

    const itemExistente = await prisma.carritoItem.findFirst({
      where: {
        id_carrito: carrito.id_carrito,
        id_producto,
      },
    });

    if (producto.inventario) {
      const stockDisponible =
        producto.inventario.cantidad_disponible -
        producto.inventario.cantidad_reservada;

      if (cantidad > stockDisponible) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          stock_disponible: stockDisponible,
          cantidad_solicitada: cantidad,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (itemExistente) {
        await tx.carritoItem.update({
          where: {
            id_carrito_item: itemExistente.id_carrito_item,
          },
          data: {
            cantidad: itemExistente.cantidad + cantidad,
          },
        });
      } else {
        await tx.carritoItem.create({
          data: {
            id_carrito: carrito.id_carrito,
            id_producto,
            cantidad,
          },
        });
      }

      if (producto.inventario) {
        await tx.inventario.update({
          where: {
            id_producto,
          },
          data: {
            cantidad_reservada: {
              increment: cantidad,
            },
          },
        });
      }
    });

    const carritoActualizado =
      await obtenerOCrearCarrito(id_usuario);

    return res.status(200).json(
      construirRespuestaCarrito(carritoActualizado)
    );
  } catch (error) {
    console.error('Error al agregar producto: - carrito.controller.ts:168', error);

    return res.status(500).json({
      error: 'Error al agregar producto al carrito',
    });
  }
};

export const updateItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
      });
    }

    const id_carrito_item = Number(req.params.id);
    const cantidad = Number(req.body.cantidad);

    if (
      !Number.isInteger(id_carrito_item) ||
      id_carrito_item <= 0
    ) {
      return res.status(400).json({
        error: 'ID de carrito inválido',
      });
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad < 0
    ) {
      return res.status(400).json({
        error: 'La cantidad debe ser un entero mayor o igual a 0',
      });
    }

    const item = await prisma.carritoItem.findUnique({
      where: {
        id_carrito_item,
      },
      include: {
        carrito: true,
        producto: {
          include: {
            inventario: true,
          },
        },
      },
    });

    if (
      !item ||
      item.carrito.id_usuario !== id_usuario
    ) {
      return res.status(404).json({
        error: 'Ítem no encontrado',
      });
    }

    if (cantidad === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.carritoItem.delete({
          where: {
            id_carrito_item,
          },
        });

        if (item.producto.inventario) {
          await tx.inventario.update({
            where: {
              id_producto: item.id_producto,
            },
            data: {
              cantidad_reservada: {
                decrement: item.cantidad,
              },
            },
          });
        }
      });

      const carritoActualizado =
        await obtenerOCrearCarrito(id_usuario);

      return res.status(200).json(
        construirRespuestaCarrito(carritoActualizado)
      );
    }

    const diferencia = cantidad - item.cantidad;

    if (
      diferencia > 0 &&
      item.producto.inventario
    ) {
      const stockDisponible =
        item.producto.inventario.cantidad_disponible -
        item.producto.inventario.cantidad_reservada;

      if (diferencia > stockDisponible) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          stock_disponible: stockDisponible,
          cantidad_adicional: diferencia,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.carritoItem.update({
        where: {
          id_carrito_item,
        },
        data: {
          cantidad,
        },
      });

      if (
        item.producto.inventario &&
        diferencia !== 0
      ) {
        await tx.inventario.update({
          where: {
            id_producto: item.id_producto,
          },
          data: {
            cantidad_reservada: {
              increment: diferencia,
            },
          },
        });
      }
    });

    const carritoActualizado =
      await obtenerOCrearCarrito(id_usuario);

    return res.status(200).json(
      construirRespuestaCarrito(carritoActualizado)
    );
  } catch (error) {
    console.error('Error al actualizar ítem: - carrito.controller.ts:316', error);

    return res.status(500).json({
      error: 'Error al actualizar ítem',
    });
  }
};

export const removeItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
      });
    }

    const id_carrito_item = Number(req.params.id);

    if (
      !Number.isInteger(id_carrito_item) ||
      id_carrito_item <= 0
    ) {
      return res.status(400).json({
        error: 'ID de carrito inválido',
      });
    }

    const item = await prisma.carritoItem.findUnique({
      where: {
        id_carrito_item,
      },
      include: {
        carrito: true,
        producto: {
          include: {
            inventario: true,
          },
        },
      },
    });

    if (
      !item ||
      item.carrito.id_usuario !== id_usuario
    ) {
      return res.status(404).json({
        error: 'Ítem no encontrado',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.carritoItem.delete({
        where: {
          id_carrito_item,
        },
      });

      if (item.producto.inventario) {
        await tx.inventario.update({
          where: {
            id_producto: item.id_producto,
          },
          data: {
            cantidad_reservada: {
              decrement: item.cantidad,
            },
          },
        });
      }
    });

    const carritoActualizado =
      await obtenerOCrearCarrito(id_usuario);

    return res.status(200).json(
      construirRespuestaCarrito(carritoActualizado)
    );
  } catch (error) {
    console.error('Error al eliminar ítem: - carrito.controller.ts:399', error);

    return res.status(500).json({
      error: 'Error al eliminar ítem',
    });
  }
};

async function obtenerOCrearCarrito(
  id_usuario: number
) {
  let carrito = await prisma.carritoCompras.findFirst({
    where: {
      id_usuario,
      estado: 'Activo',
    },
    include: carritoInclude,
  });

  if (!carrito) {
    carrito = await prisma.carritoCompras.create({
      data: {
        id_usuario,
        estado: 'Activo',
      },
      include: carritoInclude,
    });
  }

  return carrito;
}

function construirRespuestaCarrito(
  carrito: any
) {
  const subtotal = carrito.items.reduce(
    (
      acumulado: number,
      item: any
    ) => {
      return (
        acumulado +
        Number(item.producto.precio) *
          item.cantidad
      );
    },
    0
  );

  const total_items = carrito.items.reduce(
    (
      acumulado: number,
      item: any
    ) => {
      return acumulado + item.cantidad;
    },
    0
  );

  return {
    ...carrito,
    subtotal,
    total_items,
    total_productos: carrito.items.length,
  };
}
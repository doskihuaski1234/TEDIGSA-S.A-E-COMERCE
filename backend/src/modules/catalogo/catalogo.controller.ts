import { Request, Response } from 'express';

import prisma from '../../config/prisma';

import { AuthRequest } from '../../common/middleware/auth.middleware';

// ======================================================
// CATEGORÍAS
// ======================================================

export const getCategorias = async (
  _req: Request,
  res: Response
) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: {
        id_categoria_padre: null,
      },

      include: {
        subcategorias: true,

        _count: {
          select: {
            productos: true,
          },
        },
      },

      orderBy: {
        nombre: 'asc',
      },
    });

    return res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías: - catalogo.controller.ts:38', error);

    return res.status(500).json({
      error: 'Error al obtener categorías',
    });
  }
};

// ======================================================
// PRODUCTOS
// ======================================================

export const getProductos = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      categoria,
      tipo,
      search,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNumber = Math.max(
      parseInt(page as string) || 1,
      1
    );

    const limitNumber = Math.max(
      parseInt(limit as string) || 12,
      1
    );

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      estado: 'Publicado',
    };

    // --------------------------------------------------
    // FILTRO POR CATEGORÍA
    // --------------------------------------------------

    if (categoria) {
      const categoriaId = parseInt(categoria as string);

      if (!isNaN(categoriaId)) {
        where.id_categoria = categoriaId;
      }
    }

    // --------------------------------------------------
    // FILTRO POR TIPO
    // --------------------------------------------------

    if (tipo) {
      where.tipo = tipo;
    }

    // --------------------------------------------------
    // BÚSQUEDA
    // --------------------------------------------------

    if (search) {
      const textoBusqueda = search as string;

      where.OR = [
        {
          nombre: {
            contains: textoBusqueda,
          },
        },
        {
          descripcion: {
            contains: textoBusqueda,
          },
        },
        {
          sku: {
            contains: textoBusqueda,
          },
        },
      ];
    }

    // --------------------------------------------------
    // CONSULTA DE PRODUCTOS Y TOTAL
    // --------------------------------------------------

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,

        include: {
          categoria: {
            select: {
              nombre: true,
            },
          },

          inventario: {
            select: {
              cantidad_disponible: true,
              cantidad_reservada: true,
            },
          },

          _count: {
            select: {
              resenas: true,
            },
          },
        },

        skip,
        take: limitNumber,

        orderBy: {
          id_producto: 'desc',
        },
      }),

      prisma.producto.count({
        where,
      }),
    ]);

    return res.json({
      data: productos,

      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error al obtener productos: - catalogo.controller.ts:177', error);

    return res.status(500).json({
      error: 'Error al obtener productos',
    });
  }
};

// ======================================================
// OBTENER PRODUCTO POR ID
// ======================================================


// ======================================================
// ADMINISTRACIÓN - LISTAR TODOS LOS PRODUCTOS
// ======================================================

export const getProductosAdmin = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: {
          select: {
            nombre: true,
          },
        },
        proveedor: {
          select: {
            nombre: true,
          },
        },
        inventario: true,
      },
      orderBy: {
        id_producto: 'desc',
      },
    });

    return res.json({
      data: productos,
      total: productos.length,
    });
  } catch (error) {
    console.error('Error al listar productos para administración:', error);
    return res.status(500).json({
      error: 'Error al obtener los productos administrativos',
    });
  }
};

export const getProductoById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      });
    }

    const producto = await prisma.producto.findFirst({
      where: {
        id_producto: id,
        estado: 'Publicado',
      },

      include: {
        categoria: true,

        proveedor: {
          select: {
            nombre: true,
          },
        },

        inventario: true,

        resenas: {
          include: {
            usuario: {
              select: {
                nombre: true,
              },
            },
          },

          orderBy: {
            fecha: 'desc',
          },

          take: 10,
        },
      },
    });

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado',
      });
    }

    return res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto: - catalogo.controller.ts:244', error);

    return res.status(500).json({
      error: 'Error al obtener producto',
    });
  }
};

// ======================================================
// ADMINISTRACIÓN - CREAR PRODUCTO
// ======================================================

export const createProducto = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      nombre,
      descripcion,
      sku,
      tipo,
      precio,
      imagen_url,
      id_categoria,
      id_proveedor,
      cantidad_inicial,
      estado,
    } = req.body;

    // --------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------

    const precioNumero = Number(precio);
    const categoriaNumero = Number(id_categoria);
    const cantidadInicial = Number(cantidad_inicial ?? 0);
    const estadoProducto = ['Publicado', 'Borrador', 'Desactivado'].includes(estado)
      ? estado
      : 'Publicado';

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.trim().length > 150 ||
      typeof sku !== 'string' ||
      !sku.trim() ||
      sku.trim().length > 30 ||
      precio === undefined ||
      precio === null ||
      precio === '' ||
      !Number.isFinite(precioNumero) ||
      precioNumero < 0 ||
      precioNumero > 99999999.99 ||
      !Number.isInteger(categoriaNumero) ||
      categoriaNumero <= 0 ||
      !Number.isInteger(cantidadInicial) ||
      cantidadInicial < 0
    ) {
      return res.status(400).json({
        error: 'Verifica el nombre, SKU, precio, categoría y existencias del producto',
      });
    }

    // --------------------------------------------------
    // CREAR PRODUCTO
    // --------------------------------------------------

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        sku,

        tipo: tipo || 'Producto fisico',

        precio: precioNumero,

        imagen_url: imagen_url || null,

        estado: estadoProducto,

        id_categoria: categoriaNumero,

        id_proveedor: id_proveedor || null,

        inventario: {
          create: {
            cantidad_disponible: cantidadInicial,
          },
        },
      },

      include: {
        inventario: true,
        categoria: true,
      },
    });

    return res.status(201).json(producto);
  } catch (error: any) {
    // --------------------------------------------------
    // SKU DUPLICADO
    // --------------------------------------------------

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'El SKU ya existe',
      });
    }

    console.error('Error al crear producto: - catalogo.controller.ts:328', error);

    return res.status(500).json({
      error: 'Error al crear producto',
    });
  }
};

// ======================================================
// ADMINISTRACIÓN - ACTUALIZAR PRODUCTO
// ======================================================

export const updateProducto = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      });
    }

    const data = req.body ?? {};
    const datosActualizar: any = {};

    if (data.nombre !== undefined) {
      if (typeof data.nombre !== 'string' || !data.nombre.trim()) {
        return res.status(400).json({
          error: 'El nombre del producto es obligatorio',
        });
      }

      if (data.nombre.trim().length > 150) {
        return res.status(400).json({
          error: 'El nombre no puede superar los 150 caracteres',
        });
      }

      datosActualizar.nombre = data.nombre.trim();
    }

    if (data.sku !== undefined) {
      if (typeof data.sku !== 'string' || !data.sku.trim()) {
        return res.status(400).json({
          error: 'El SKU del producto es obligatorio',
        });
      }

      if (data.sku.trim().length > 30) {
        return res.status(400).json({
          error: 'El SKU no puede superar los 30 caracteres',
        });
      }

      datosActualizar.sku = data.sku.trim();
    }

    if (data.descripcion !== undefined) {
      if (data.descripcion !== null && typeof data.descripcion !== 'string') {
        return res.status(400).json({
          error: 'La descripción debe ser texto',
        });
      }

      datosActualizar.descripcion =
        typeof data.descripcion === 'string'
          ? data.descripcion.trim()
          : null;
    }

    if (data.precio !== undefined) {
      if (
        data.precio === '' ||
        data.precio === null ||
        !Number.isFinite(Number(data.precio))
      ) {
        return res.status(400).json({
          error: 'El precio debe ser un n?mero v?lido',
        });
      }

      const precio = Number(data.precio);

      if (precio < 0 || precio > 99999999.99) {
        return res.status(400).json({
          error: 'El precio debe estar entre 0 y 99,999,999.99',
        });
      }

      datosActualizar.precio = precio;
    }

    if (data.id_categoria !== undefined) {
      const idCategoria = Number(data.id_categoria);

      if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        return res.status(400).json({
          error: 'La categoría seleccionada no es válida',
        });
      }

      datosActualizar.id_categoria = idCategoria;
    }

    if (data.estado !== undefined) {
      const estadosPermitidos = ['Publicado', 'Borrador', 'Desactivado'];

      if (!estadosPermitidos.includes(data.estado)) {
        return res.status(400).json({
          error: 'El estado del producto no es válido',
        });
      }

      datosActualizar.estado = data.estado;
    }

    if (data.imagen_url !== undefined) {
      if (data.imagen_url === null || data.imagen_url === '') {
        datosActualizar.imagen_url = null;
      } else {
        if (typeof data.imagen_url !== 'string' || data.imagen_url.length > 255) {
          return res.status(400).json({
            error: 'La imagen debe ser una URL válida',
          });
        }

        try {
          const urlImagen = new URL(data.imagen_url);

          if (!['http:', 'https:'].includes(urlImagen.protocol)) {
            throw new Error('Protocolo no permitido');
          }

          datosActualizar.imagen_url = urlImagen.toString();
        } catch {
          return res.status(400).json({
            error: 'La imagen debe tener una URL HTTP o HTTPS v?lida',
          });
        }
      }
    }

    if (data.tipo !== undefined) {
      if (data.tipo !== null && typeof data.tipo !== 'string') {
        return res.status(400).json({
          error: 'El tipo de producto debe ser texto',
        });
      }

      datosActualizar.tipo =
        typeof data.tipo === 'string' ? data.tipo.trim() : null;
    }

    if (Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({
        error: 'No se recibieron campos v?lidos para actualizar',
      });
    }

    const producto = await prisma.producto.update({
      where: {
        id_producto: id,
      },
      data: datosActualizar,
      include: {
        inventario: true,
      },
    });

    return res.json(producto);
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Producto o categoría relacionada no encontrada',
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe un producto con ese SKU u otro campo único',
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'La categoría seleccionada no existe',
      });
    }

    return res.status(500).json({
      error: 'Error al actualizar producto',
    });
  }
};


// ======================================================

export const updateInventario = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_producto = Number(req.params.id);

    if (!Number.isSafeInteger(id_producto) || id_producto <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      });
    }

    const {
      cantidad_disponible,
      cantidad_reservada,
    } = req.body ?? {};

    if (
      cantidad_disponible === undefined &&
      cantidad_reservada === undefined
    ) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos una cantidad para actualizar',
      });
    }

    if (
      (cantidad_disponible !== undefined &&
        (!Number.isSafeInteger(cantidad_disponible) || cantidad_disponible < 0)) ||
      (cantidad_reservada !== undefined &&
        (!Number.isSafeInteger(cantidad_reservada) || cantidad_reservada < 0))
    ) {
      return res.status(400).json({
        error: 'Las cantidades deben ser números enteros no negativos',
      });
    }

    const datos = {
      ...(cantidad_disponible !== undefined && { cantidad_disponible }),
      ...(cantidad_reservada !== undefined && { cantidad_reservada }),
    };

    const inventario = await prisma.inventario.upsert({
      where: { id_producto },
      update: datos,
      create: {
        id_producto,
        cantidad_disponible: cantidad_disponible ?? 0,
        cantidad_reservada: cantidad_reservada ?? 0,
      },
    });

    return res.json(inventario);
  } catch (error: any) {
    console.error('Error al actualizar inventario:', error);

    if (error.code === 'P2003') {
      return res.status(404).json({
        error: 'El producto indicado no existe',
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Producto o inventario no encontrado',
      });
    }

    return res.status(500).json({
      error: 'Error al actualizar inventario',
    });
  }
};

// Eliminar producto únicamente cuando no tenga pedidos ni carritos asociados.
export const eliminarProducto = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'ID de producto inválido.',
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        _count: {
          select: {
            carritoItems: true,
            detalleOrdenes: true,
          },
        },
      },
    });

    if (!producto) {
      return res.status(404).json({
        error: 'El producto no existe.',
      });
    }

    if (producto._count.detalleOrdenes > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar este producto porque está asociado a pedidos. Puedes desactivarlo para retirarlo de la tienda.',
      });
    }

    if (producto._count.carritoItems > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar este producto porque aparece en carritos de compra.',
      });
    }

    await prisma.producto.delete({
      where: { id_producto: id },
    });

    return res.json({
      mensaje: 'Producto eliminado correctamente.',
      id_producto: id,
    });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);

    if (error?.code === 'P2025') {
      return res.status(404).json({
        error: 'El producto ya no existe.',
      });
    }

    if (error?.code === 'P2003') {
      return res.status(409).json({
        error: 'No se puede eliminar el producto porque existen registros relacionados.',
      });
    }

    return res.status(500).json({
      error: 'Ocurrió un error al eliminar el producto.',
    });
  }
};

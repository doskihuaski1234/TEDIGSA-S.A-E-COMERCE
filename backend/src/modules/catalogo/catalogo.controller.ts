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

    const producto = await prisma.producto.findUnique({
      where: {
        id_producto: id,
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
    } = req.body;

    // --------------------------------------------------
    // VALIDACIONES
    // --------------------------------------------------

    if (!nombre || !sku || precio === undefined) {
      return res.status(400).json({
        error: 'Nombre, SKU y precio son obligatorios',
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

        precio,

        imagen_url,

        id_categoria,

        id_proveedor,

        inventario: {
          create: {
            cantidad_disponible: cantidad_inicial || 0,
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
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      });
    }

    const data = req.body;

    const producto = await prisma.producto.update({
      where: {
        id_producto: id,
      },

      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        imagen_url: data.imagen_url,
        estado: data.estado,
        id_categoria: data.id_categoria,
        tipo: data.tipo,
      },

      include: {
        inventario: true,
      },
    });

    return res.json(producto);
  } catch (error: any) {
    console.error('Error al actualizar producto: - catalogo.controller.ts:377', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Producto no encontrado',
      });
    }

    return res.status(500).json({
      error: 'Error al actualizar producto',
    });
  }
};

// ======================================================
// ADMINISTRACIÓN - ACTUALIZAR INVENTARIO
// ======================================================

export const updateInventario = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id_producto = parseInt(req.params.id);

    if (isNaN(id_producto)) {
      return res.status(400).json({
        error: 'ID de producto inválido',
      });
    }

    const {
      cantidad_disponible,
      cantidad_reservada,
    } = req.body;

    // --------------------------------------------------
    // VALIDAR DATOS
    // --------------------------------------------------

    if (
      cantidad_disponible === undefined &&
      cantidad_reservada === undefined
    ) {
      return res.status(400).json({
        error:
          'Debe proporcionar al menos un valor para actualizar',
      });
    }

    // --------------------------------------------------
    // ACTUALIZAR INVENTARIO
    // --------------------------------------------------

    const inventario = await prisma.inventario.update({
      where: {
        id_producto,
      },

      data: {
        ...(cantidad_disponible !== undefined && {
          cantidad_disponible,
        }),

        ...(cantidad_reservada !== undefined && {
          cantidad_reservada,
        }),
      },
    });

    // --------------------------------------------------
    // ACTUALIZAR ESTADO DEL PRODUCTO
    // --------------------------------------------------

    if (cantidad_disponible !== undefined) {
      if (cantidad_disponible === 0) {
        await prisma.producto.update({
          where: {
            id_producto,
          },

          data: {
            estado: 'Agotado',
          },
        });
      } else {
        await prisma.producto.update({
          where: {
            id_producto,
          },

          data: {
            estado: 'Publicado',
          },
        });
      }
    }

    return res.json(inventario);
  } catch (error: any) {
    console.error(
      'Error al actualizar inventario:',
      error
    );

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
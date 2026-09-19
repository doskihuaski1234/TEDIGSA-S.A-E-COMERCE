import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

// ========== CATEGORÍAS ==========
export const getCategorias = async (_req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { id_categoria_padre: null },
      include: {
        subcategorias: true,
        _count: { select: { productos: true } },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// ========== PRODUCTOS ==========
export const getProductos = async (req: Request, res: Response) => {
  try {
    const { categoria, tipo, search, page = '1', limit = '12' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { estado: 'Publicado' };
    if (categoria) where.id_categoria = parseInt(categoria as string);
    if (tipo) where.tipo = tipo;
    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { descripcion: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          categoria: { select: { nombre: true } },
          inventario: { select: { cantidad_disponible: true } },
          _count: { select: { resenas: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { id_producto: 'desc' },
      }),
      prisma.producto.count({ where }),
    ]);

    res.json({
      data: productos,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const getProductoById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const producto = await prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        categoria: true,
        proveedor: { select: { nombre: true } },
        inventario: true,
        resenas: {
          include: { usuario: { select: { nombre: true } } },
          orderBy: { fecha: 'desc' },
          take: 10,
        },
      },
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// ========== ADMIN: CRUD Productos ==========
export const createProducto = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, descripcion, sku, tipo, precio, imagen_url, id_categoria, id_proveedor, cantidad_inicial } = req.body;

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
      include: { inventario: true, categoria: true },
    });

    res.status(201).json(producto);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El SKU ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const updateProducto = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const producto = await prisma.producto.update({
      where: { id_producto: id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        imagen_url: data.imagen_url,
        estado: data.estado,
        id_categoria: data.id_categoria,
        tipo: data.tipo,
      },
      include: { inventario: true },
    });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const updateInventario = async (req: AuthRequest, res: Response) => {
  try {
    const id_producto = parseInt(req.params.id);
    const { cantidad_disponible, cantidad_reservada } = req.body;

    const inventario = await prisma.inventario.update({
      where: { id_producto },
      data: {
        ...(cantidad_disponible !== undefined && { cantidad_disponible }),
        ...(cantidad_reservada !== undefined && { cantidad_reservada }),
      },
    });

    // Actualizar estado del producto si stock = 0
    if (cantidad_disponible === 0) {
      await prisma.producto.update({
        where: { id_producto },
        data: { estado: 'Agotado' },
      });
    } else {
      await prisma.producto.update({
        where: { id_producto },
        data: { estado: 'Publicado' },
      });
    }

    res.json(inventario);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
};

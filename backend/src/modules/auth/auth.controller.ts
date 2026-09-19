import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Rol Cliente por defecto (id_rol = 1 asumido, se crea en seed)
    const rolCliente = await prisma.rol.findFirst({ where: { nombre: 'Cliente' } });
    if (!rolCliente) {
      return res.status(500).json({ error: 'Rol Cliente no configurado. Ejecute el seed.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password_hash,
        telefono,
        id_rol: rolCliente.id_rol,
      },
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        telefono: true,
        estado: true,
        fecha_registro: true,
        rol: { select: { nombre: true } },
      },
    });

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        id_rol: rolCliente.id_rol,
        rol: 'Cliente',
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ usuario, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario || usuario.estado !== 'Activo') {
      return res.status(401).json({ error: 'Credenciales inválidas o cuenta inactiva' });
    }

    const valid = await bcrypt.compare(password, usuario.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        id_rol: usuario.id_rol,
        rol: usuario.rol.nombre,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        estado: usuario.estado,
        rol: usuario.rol.nombre,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: req.user!.id_usuario },
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        telefono: true,
        estado: true,
        fecha_registro: true,
        rol: { select: { nombre: true } },
        direcciones: true,
      },
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

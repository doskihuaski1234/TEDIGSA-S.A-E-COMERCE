import { Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';

export const crearDireccion = async (req: AuthRequest, res: Response) => {
  try {
    const { calle, ciudad, departamento, codigo_postal } = req.body;

    if (
      typeof calle !== 'string' || !calle.trim() ||
      typeof ciudad !== 'string' || !ciudad.trim() ||
      typeof departamento !== 'string' || !departamento.trim()
    ) {
      return res.status(400).json({
        error: 'Completa la calle, el municipio y el departamento.'
      });
    }

    if (
      calle.trim().length > 150 ||
      ciudad.trim().length > 80 ||
      departamento.trim().length > 80 ||
      (codigo_postal != null && String(codigo_postal).length > 10)
    ) {
      return res.status(400).json({
        error: 'Uno de los campos supera la longitud permitida.'
      });
    }

    const direccion = await prisma.direccion.create({
      data: {
        id_usuario: req.user!.id_usuario,
        calle: calle.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        codigo_postal: codigo_postal ? String(codigo_postal).trim() : null,
        tipo: 'Entrega'
      }
    });

    return res.status(201).json({
      message: 'Dirección de entrega registrada.',
      direccion
    });
  } catch (error) {
    console.error('Error al registrar dirección:', error);
    return res.status(500).json({
      error: 'No se pudo registrar la dirección de entrega.'
    });
  }
};
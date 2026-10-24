import { Router, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { authenticate, AuthRequest, authorize } from "../common/middleware/auth.middleware";

const router = Router();
const rolesAdmin = ["Administrador", "Encargado de Ventas/Bodega"];

router.use(authenticate);

function usuarioId(req: AuthRequest): number {
  return Number(req.user?.id_usuario);
}

function esAdmin(req: AuthRequest): boolean {
  return rolesAdmin.includes(String(req.user?.rol ?? ""));
}

router.post("/conversacion", async (req: AuthRequest, res: Response) => {
  try {
    const id_usuario = usuarioId(req);
    if (!id_usuario) {
      return res.status(401).json({ mensaje: "Inicia sesión para usar el chat." });
    }

    const ultima = await prisma.chatConversacion.findFirst({
      where: { id_usuario },
      orderBy: { fecha_actualizacion: "desc" }
    });

    if (ultima?.estado === "Bloqueada") {
      return res.status(403).json({
        mensaje: "Tu chat está bloqueado temporalmente. Contacta a TEDIGSA por WhatsApp si necesitas asistencia."
      });
    }

    if (ultima?.estado === "Abierta") {
      const existente = await prisma.chatConversacion.findUnique({
        where: { id_conversacion: ultima.id_conversacion },
        include: { mensajes: { orderBy: { fecha_envio: "asc" } } }
      });
      return res.json(existente);
    }

    const conversacion = await prisma.chatConversacion.create({
      data: { id_usuario },
      include: { mensajes: true }
    });

    return res.json(conversacion);
  } catch (error) {
    console.error("Error creando conversación:", error);
    return res.status(500).json({ mensaje: "No se pudo abrir el chat." });
  }
});

router.get("/conversacion/mia", async (req: AuthRequest, res: Response) => {
  try {
    const conversacion = await prisma.chatConversacion.findFirst({
      where: { id_usuario: usuarioId(req) },
      orderBy: { fecha_actualizacion: "desc" },
      include: {
        mensajes: { orderBy: { fecha_envio: "asc" } }
      }
    });
    return res.json(conversacion);
  } catch (error) {
    console.error("Error consultando conversación:", error);
    return res.status(500).json({ mensaje: "No se pudo consultar el chat." });
  }
});

router.post("/conversacion/:id/mensajes", async (req: AuthRequest, res: Response) => {
  try {
    const id_conversacion = Number(req.params.id);
    const mensaje = String(req.body?.mensaje ?? "").trim();
    if (!Number.isInteger(id_conversacion) || id_conversacion < 1) {
      return res.status(400).json({ mensaje: "Conversación inválida." });
    }
    if (!mensaje || mensaje.length > 4000) {
      return res.status(400).json({ mensaje: "Escribe un mensaje de hasta 4000 caracteres." });
    }

    const conversacion = await prisma.chatConversacion.findUnique({
      where: { id_conversacion }
    });
    if (!conversacion) return res.status(404).json({ mensaje: "Conversación no encontrada." });
    if (!esAdmin(req) && conversacion.id_usuario !== usuarioId(req)) {
      return res.status(403).json({ mensaje: "No tienes acceso a esta conversación." });
    }
    if (conversacion.estado === "Bloqueada" && !esAdmin(req)) {
      return res.status(403).json({
        mensaje: "Tu chat está bloqueado temporalmente. Contacta a TEDIGSA por WhatsApp."
      });
    }
    if (conversacion.estado !== "Abierta") {
      return res.status(409).json({
        mensaje: conversacion.estado === "Bloqueada"
          ? "Esta conversación está bloqueada."
          : "Esta conversación está cerrada."
      });
    }

    const creado = await prisma.chatMensaje.create({
      data: {
        id_conversacion,
        id_autor: usuarioId(req),
        remitente: esAdmin(req) ? "Administrador" : "Cliente",
        mensaje
      }
    });

    await prisma.chatConversacion.update({
      where: { id_conversacion },
      data: { fecha_actualizacion: new Date() }
    });

    return res.status(201).json(creado);
  } catch (error) {
    console.error("Error guardando mensaje:", error);
    return res.status(500).json({ mensaje: "No se pudo guardar el mensaje." });
  }
});

router.get(
  "/admin/conversaciones",
  authorize(...rolesAdmin),
  async (_req: AuthRequest, res: Response) => {
    try {
      const conversaciones = await prisma.chatConversacion.findMany({
        orderBy: { fecha_actualizacion: "desc" },
        include: {
          usuario: { select: { id_usuario: true, nombre: true, email: true, telefono: true } },
          mensajes: { orderBy: { fecha_envio: "desc" }, take: 1 }
        }
      });
      return res.json(conversaciones);
    } catch (error) {
      console.error("Error listando chats:", error);
      return res.status(500).json({ mensaje: "No se pudieron cargar las conversaciones." });
    }
  }
);

router.get(
  "/admin/conversaciones/:id/mensajes",
  authorize(...rolesAdmin),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const conversacion = await prisma.chatConversacion.findUnique({
        where: { id_conversacion: id },
        include: { mensajes: { orderBy: { fecha_envio: "asc" } } }
      });
      if (!conversacion) return res.status(404).json({ mensaje: "Conversación no encontrada." });
      return res.json(conversacion);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      return res.status(500).json({ mensaje: "No se pudieron cargar los mensajes." });
    }
  }
);

router.patch(
  "/admin/conversaciones/:id/estado",
  authorize(...rolesAdmin),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const estado = String(req.body?.estado ?? "");
      if (!["Abierta", "Cerrada", "Bloqueada"].includes(estado)) {
        return res.status(400).json({ mensaje: "Estado inválido." });
      }
      const actualizada = await prisma.chatConversacion.update({
        where: { id_conversacion: id },
        data: { estado }
      });
      return res.json(actualizada);
    } catch (error) {
      console.error("Error actualizando conversación:", error);
      return res.status(500).json({ mensaje: "No se pudo actualizar la conversación." });
    }
  }
);


router.delete(
  "/admin/conversaciones/:id",
  authorize(...rolesAdmin),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ mensaje: "Identificador de conversación inválido." });
      }

      const existente = await prisma.chatConversacion.findUnique({
        where: { id_conversacion: id }
      });

      if (!existente) {
        return res.status(404).json({ mensaje: "La conversación ya no existe." });
      }

      await prisma.chatConversacion.delete({
        where: { id_conversacion: id }
      });

      return res.json({ mensaje: "Conversación eliminada correctamente." });
    } catch (error) {
      console.error("Error eliminando conversación:", error);
      return res.status(500).json({ mensaje: "No se pudo eliminar la conversación." });
    }
  }
);
export default router;

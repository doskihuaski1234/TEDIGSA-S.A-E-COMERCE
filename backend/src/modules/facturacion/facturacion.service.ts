export type EstadoFacturaFEL =
  | 'Pendiente'
  | 'En proceso'
  | 'Certificada'
  | 'Rechazada';

export interface ResultadoCertificacionFEL {
  certificada: boolean;
  estado: EstadoFacturaFEL;
  mensaje: string;
  numeroDte?: string;
  uuidSat?: string;
  xml?: string;
}

/**
 * Adaptador seguro inicial.
 *
 * No simula una certificación ni llama a una URL de ejemplo.
 * Se debe implementar el contrato concreto del certificador autorizado
 * antes de emitir documentos tributarios reales.
 */
export async function certificarFacturaFEL(
  _idFactura: number,
): Promise<ResultadoCertificacionFEL> {
  const apiUrl = process.env.FEL_API_URL?.trim();

  if (
    !apiUrl ||
    apiUrl.includes('example.com') ||
    apiUrl.includes('example.org')
  ) {
    throw new Error(
      'FEL no está configurado: FEL_API_URL sigue siendo una URL de ejemplo. Configure un certificador real antes de emitir.',
    );
  }

  const nitEmisor = process.env.FEL_NIT_EMISOR?.trim();
  const usuario = process.env.FEL_USER?.trim();
  const password = process.env.FEL_PASSWORD?.trim();

  if (!nitEmisor || !usuario || !password) {
    throw new Error(
      'Faltan credenciales de FEL. Configure FEL_NIT_EMISOR, FEL_USER y FEL_PASSWORD en el entorno del backend.',
    );
  }

  throw new Error(
    'El certificador está configurado, pero falta implementar su contrato API específico. No se ha enviado ni certificado ninguna factura.',
  );
}

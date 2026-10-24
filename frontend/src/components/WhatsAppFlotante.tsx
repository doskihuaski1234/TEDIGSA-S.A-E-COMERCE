import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  MessageCircle, X, Search, Paperclip, Smile, Send, Headphones,
  Check, CheckCheck, ArrowLeft, MoreVertical, Camera, ShoppingBag,
  Wrench, Phone, Video, Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const WHATSAPP_URL = 'https://wa.me/50230401481?text=';

const OPCIONES = [
  { texto: 'Cámaras y alarmas', icono: Camera },
  { texto: 'Productos y precios', icono: ShoppingBag },
  { texto: 'Instalación y asesoría', icono: Wrench },
];

const EMOJIS = ['😀', '😁', '😂', '😊', '😍', '🥰', '😉', '😎', '🤔', '👍', '👏', '🙏', '❤️', '🔥', '✅', '🎉', '📷', '💻'];

type Mensaje = {
  id_mensaje: number;
  mensaje: string;
  remitente: string;
  fecha_envio: string;
};

type Conversacion = {
  id_conversacion: number;
  estado: string;
  mensajes?: Mensaje[];
};

const esAdmin = (rol?: string) =>
  rol === 'Administrador' || rol === 'Encargado de Ventas/Bodega';

const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function WhatsAppFlotante() {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [emojisAbiertos, setEmojisAbiertos] = useState(false);
  const [adjuntosAbiertos, setAdjuntosAbiertos] = useState(false);

  const campoRef = useRef<HTMLInputElement>(null);
  const mensajesRef = useRef<HTMLDivElement>(null);
  const ultimaCargaRef = useRef(false);

  const cargarConversacion = useCallback(async (crear = false) => {
    if (!user || esAdmin(user.rol) || ultimaCargaRef.current) return;

    ultimaCargaRef.current = true;
    setCargando(true);

    try {
      let respuesta = await api.get('/chat/conversacion/mia');
      let actual = respuesta.data as Conversacion | null;

      if (!actual && crear) {
        respuesta = await api.post('/chat/conversacion');
        actual = respuesta.data as Conversacion;
      }

      setConversacion(actual);

      if (actual?.id_conversacion) {
        const detalle = await api.get('/chat/conversacion/mia');
        setMensajes(detalle.data?.mensajes ?? []);
      } else {
        setMensajes([]);
      }

      setError('');
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? 'No se pudo cargar el chat. Intenta de nuevo.');
    } finally {
      setCargando(false);
      ultimaCargaRef.current = false;
    }
  }, [user?.id_usuario, user?.rol]);

  useEffect(() => {
    if (!abierto || !user || esAdmin(user.rol)) return;

    void cargarConversacion(true);
    const intervalo = window.setInterval(() => {
      void cargarConversacion(false);
    }, 3000);

    return () => window.clearInterval(intervalo);
  }, [abierto, user?.id_usuario, user?.rol, cargarConversacion]);

  useEffect(() => {
    if (abierto && !minimizado) campoRef.current?.focus();
  }, [abierto, minimizado]);

  useEffect(() => {
    const elemento = mensajesRef.current;
    if (elemento) elemento.scrollTop = elemento.scrollHeight;
  }, [mensajes, abierto, minimizado]);

  const enviarConsulta = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const texto = consulta.trim();

    if (!texto || enviando || !user || esAdmin(user.rol)) return;

    setEnviando(true);
    setError('');

    try {
      let actual = conversacion;

      if (!actual?.id_conversacion) {
        const respuesta = await api.post('/chat/conversacion');
        actual = respuesta.data as Conversacion;
        setConversacion(actual);
      }

      if (actual.estado === 'Bloqueada') {
        setError('Tu chat está bloqueado temporalmente. Puedes contactarnos por WhatsApp.');
        return;
      }

      if (actual.estado === 'Cerrada') {
        setError('Esta conversación está cerrada. Actualiza el chat para abrir una nueva.');
        return;
      }

      await api.post(
        `/chat/conversacion/${actual.id_conversacion}/mensajes`,
        { mensaje: texto }
      );

      setConsulta('');
      setEmojisAbiertos(false);
      setAdjuntosAbiertos(false);
      await cargarConversacion(false);
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  const abrirWhatsApp = () => {
    const textoFinal = [
      'Hola, necesito asesoría sobre los productos de TEDIGSA.',
      ...mensajes.map((m) => `${m.remitente}: ${m.mensaje}`),
      ...(consulta.trim() ? [consulta.trim()] : []),
    ].join('\n');

    window.open(
      `${WHATSAPP_URL}${encodeURIComponent(textoFinal)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const visibles = mensajes.filter((m) =>
    !busqueda || m.mensaje.toLowerCase().includes(busqueda.toLowerCase())
  );

  const insertarEmoji = (emoji: string) => {
    setConsulta((actual) => actual + emoji);
    setEmojisAbiertos(false);
    campoRef.current?.focus();
  };

  const esCliente = user && !esAdmin(user.rol);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {abierto && !minimizado && (
        <section
          aria-label="Chat TEDIGSA estilo WhatsApp"
          className="flex w-[calc(100vw-2rem)] max-w-[410px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
          style={{ height: 'min(650px, calc(100dvh - 100px))' }}
        >
          <header className="flex shrink-0 items-center gap-2 bg-[#075E54] px-3 py-3 text-white">
            {busquedaAbierta ? (
              <>
                <button type="button" onClick={() => { setBusquedaAbierta(false); setBusqueda(''); }} aria-label="Volver" className="rounded-full p-2 hover:bg-white/10">
                  <ArrowLeft size={21} />
                </button>
                <input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en el chat..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-green-100" />
                <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="p-2">
                  <X size={19} />
                </button>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                  <Headphones size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold">TEDIGSA</h2>
                  <p className="text-xs text-green-100">
                    {esAdmin(user?.rol) ? 'Panel de administración' : user ? 'Atención al cliente' : 'Estamos para ayudarte'}
                  </p>
                </div>
                {user && !esAdmin(user.rol) && (
                  <button type="button" onClick={() => setBusquedaAbierta(true)} aria-label="Buscar mensajes" className="rounded-full p-2 hover:bg-white/10">
                    <Search size={20} />
                  </button>
                )}
                <button type="button" onClick={() => setMinimizado(true)} aria-label="Minimizar" className="rounded-full p-2 hover:bg-white/10">
                  <MoreVertical size={20} />
                </button>
                <button type="button" onClick={() => { setAbierto(false); setMinimizado(false); }} aria-label="Cerrar chat" className="rounded-full p-2 hover:bg-white/10">
                  <X size={20} />
                </button>
              </>
            )}
          </header>

          <div ref={mensajesRef} className="flex-1 space-y-3 overflow-y-auto bg-[#EDE5DB] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[length:20px_20px] p-3 sm:p-4">
            <div className="mx-auto w-fit rounded-lg bg-[#FFF3C4] px-3 py-1.5 text-center text-[11px] leading-4 text-slate-600 shadow-sm">
              Los mensajes de esta conversación se muestran aquí.
            </div>

            {!user && (
              <div className="mx-auto max-w-[300px] rounded-xl bg-white p-4 text-center shadow-sm">
                <MessageCircle size={30} className="mx-auto mb-2 text-[#128C7E]" />
                <p className="text-sm font-semibold text-slate-800">Conversa con nuestro equipo</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Inicia sesión para enviar mensajes y recibir respuestas guardadas en tu cuenta.</p>
                <Link to="/login" className="mt-3 inline-block rounded-full bg-[#128C7E] px-5 py-2 text-sm font-semibold text-white">Iniciar sesión</Link>
              </div>
            )}

            {esAdmin(user?.rol) && (
              <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-700">Administra y responde las conversaciones desde el panel.</p>
                <Link to="/admin/chat" className="mt-3 inline-block rounded-full bg-[#128C7E] px-4 py-2 text-sm font-semibold text-white">Abrir panel de chat</Link>
              </div>
            )}

            {esCliente && (
              <div className="max-w-[92%] rounded-xl rounded-tl-sm bg-white p-3 text-sm leading-5 text-slate-800 shadow-sm">
                ¡Hola, {user.nombre}! 👋 Bienvenido a TEDIGSA.
                <p className="mt-1">Cuéntanos qué necesitas y nuestro equipo te responderá por aquí.</p>
                <p className="mt-2 text-right text-[10px] text-slate-400">TEDIGSA</p>
              </div>
            )}

            {visibles.map((mensaje) => {
              const propio = mensaje.remitente === 'Cliente';
              return (
                <div key={mensaje.id_mensaje} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm leading-5 shadow-sm ${propio ? 'rounded-tr-sm bg-[#D9FDD3] text-slate-800' : 'rounded-tl-sm bg-white text-slate-800'}`}>
                    {!propio && <p className="mb-1 text-[11px] font-bold text-[#128C7E]">TEDIGSA · Atención</p>}
                    {mensaje.mensaje}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                      {hora(mensaje.fecha_envio)}
                      {propio && <CheckCheck size={14} className="text-[#53A6D1]" />}
                      {!propio && <Check size={12} />}
                    </div>
                  </div>
                </div>
              );
            })}

            {cargando && <p className="text-center text-xs text-slate-500">Sincronizando mensajes...</p>}

            {esCliente && mensajes.length === 0 && !cargando && (
              <div className="mx-auto max-w-[300px] rounded-xl bg-white/90 p-3 text-center shadow-sm">
                <p className="text-xs font-semibold text-slate-700">Consultas rápidas</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {OPCIONES.map(({ texto, icono: Icono }) => (
                    <button key={texto} type="button" onClick={() => setConsulta((actual) => actual ? `${actual} ${texto}` : texto)} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:border-[#25D366]">
                      <Icono size={14} className="text-[#128C7E]" />{texto}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div role="alert" className="mx-auto max-w-[95%] rounded-lg bg-red-50 p-2 text-xs text-red-700 shadow-sm">{error}</div>}
          </div>

          {esCliente && (
            <div className="relative shrink-0 bg-[#F0F2F5] px-2 pb-2 pt-2">
              {emojisAbiertos && (
                <div className="mb-2 grid grid-cols-6 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertarEmoji(emoji)} className="rounded-lg p-1.5 text-xl hover:bg-slate-100">{emoji}</button>
                  ))}
                </div>
              )}

              {adjuntosAbiertos && (
                <div className="mb-2 flex gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                  <button type="button" onClick={() => { setConsulta((actual) => actual ? `${actual} [Quiero compartir una imagen]` : '[Quiero compartir una imagen]'); setAdjuntosAbiertos(false); }} className="flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs text-slate-600 hover:bg-slate-50">
                    <ImageIcon size={22} className="text-purple-600" /> Imagen
                  </button>
                  <button type="button" onClick={() => { setConsulta((actual) => actual ? `${actual} [Necesito adjuntar un archivo]` : '[Necesito adjuntar un archivo]'); setAdjuntosAbiertos(false); }} className="flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs text-slate-600 hover:bg-slate-50">
                    <Paperclip size={22} className="text-blue-600" /> Archivo
                  </button>
                  <button type="button" onClick={() => { setAdjuntosAbiertos(false); abrirWhatsApp(); }} className="flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs text-slate-600 hover:bg-slate-50">
                    <Camera size={22} className="text-green-600" /> Compartir
                  </button>
                </div>
              )}

              <form onSubmit={enviarConsulta} className="flex items-end gap-1.5">
                <button type="button" onClick={() => { setEmojisAbiertos((v) => !v); setAdjuntosAbiertos(false); }} aria-label="Abrir emojis" className="mb-1 rounded-full p-2 text-slate-500 hover:bg-slate-200">
                  <Smile size={23} />
                </button>
                <button type="button" onClick={() => { setAdjuntosAbiertos((v) => !v); setEmojisAbiertos(false); }} aria-label="Opciones de adjuntos" className="mb-1 rounded-full p-2 text-slate-500 hover:bg-slate-200">
                  <Paperclip size={22} />
                </button>
                <input
                  ref={campoRef}
                  type="text"
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEmojisAbiertos(false);
                      setAdjuntosAbiertos(false);
                    }
                  }}
                  placeholder="Escribe un mensaje"
                  aria-label="Escribe un mensaje"
                  maxLength={4000}
                  className="min-w-0 flex-1 rounded-2xl border-0 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-[#25D366]"
                />
                <button type="submit" disabled={!consulta.trim() || enviando || cargando || conversacion?.estado === 'Cerrada' || conversacion?.estado === 'Bloqueada'} aria-label="Enviar mensaje" className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white transition hover:bg-[#075E54] disabled:cursor-not-allowed disabled:opacity-40">
                  <Send size={19} />
                </button>
              </form>
              <div className="pt-1 text-center text-[10px] text-slate-500">
                {conversacion?.estado === 'Cerrada' || conversacion?.estado === 'Bloqueada' ? 'Conversación cerrada' : 'Mensajes guardados · Actualización automática'}
              </div>
            </div>
          )}

          <button type="button" onClick={abrirWhatsApp} className="flex shrink-0 items-center justify-center gap-2 bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1EBE5D]">
            <MessageCircle size={18} /> Continuar por WhatsApp
          </button>
        </section>
      )}

      {abierto && minimizado && (
        <button type="button" onClick={() => setMinimizado(false)} className="flex items-center gap-2 rounded-full bg-[#075E54] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <MessageCircle size={20} /> Volver al chat
        </button>
      )}

      <button
        type="button"
        onClick={() => { setAbierto((v) => !v); setMinimizado(false); }}
        aria-label={abierto ? 'Cerrar chat TEDIGSA' : 'Abrir chat TEDIGSA'}
        aria-expanded={abierto && !minimizado}
        className="relative flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 text-white shadow-xl shadow-green-900/25 transition hover:scale-105 hover:bg-[#1EBE5D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
      >
        {abierto ? <X size={25} /> : <MessageCircle size={26} />}
        <span className="text-sm font-bold">{abierto ? 'Cerrar' : '¿Necesitas asesoría?'}</span>
      </button>
    </div>
  );
}
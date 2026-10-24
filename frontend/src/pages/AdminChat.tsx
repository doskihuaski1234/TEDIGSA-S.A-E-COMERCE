import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Send, Shield, ShieldOff, Trash2, LockKeyhole,
  MessageCircle, RefreshCw, CheckCircle2, Clock3, UserRound,
  MoreVertical, X, Inbox, Headphones, CheckCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

type Mensaje = {
  id_mensaje: number;
  remitente: string;
  mensaje: string;
  fecha_envio: string;
};

type Conversacion = {
  id_conversacion: number;
  estado: string;
  fecha_actualizacion?: string;
  usuario: {
    id_usuario: number;
    nombre: string;
    email: string;
    telefono?: string | null;
  };
  mensajes: Mensaje[];
};

const fechaHora = (valor?: string) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleString("es-GT", {
        day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit"
      });
};

const iniciales = (nombre: string) =>
  nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0] ?? "").join("").toUpperCase();

export default function AdminChat() {
  const { user, isAdmin, loading } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const cargarConversaciones = useCallback(async () => {
    try {
      const { data } = await api.get("/chat/admin/conversaciones");
      setConversaciones(Array.isArray(data) ? data : []);
      setError("");
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? "No se pudieron cargar las conversaciones.");
    }
  }, []);

  const cargarMensajes = useCallback(async (id: number) => {
    try {
      const { data } = await api.get(`/chat/admin/conversaciones/${id}/mensajes`);
      setMensajes(data?.mensajes ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? "No se pudieron cargar los mensajes.");
    }
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;
    void cargarConversaciones();
    const timer = window.setInterval(() => void cargarConversaciones(), 5000);
    return () => window.clearInterval(timer);
  }, [user, isAdmin, cargarConversaciones]);

  useEffect(() => {
    if (!seleccionada) {
      setMensajes([]);
      return;
    }
    void cargarMensajes(seleccionada);
    const timer = window.setInterval(() => void cargarMensajes(seleccionada), 3000);
    return () => window.clearInterval(timer);
  }, [seleccionada, cargarMensajes]);

  const actual = conversaciones.find(c => c.id_conversacion === seleccionada);

  const filtradas = useMemo(() => conversaciones.filter(c => {
    const q = busqueda.trim().toLowerCase();
    const coincide = !q ||
      c.usuario.nombre.toLowerCase().includes(q) ||
      c.usuario.email.toLowerCase().includes(q) ||
      String(c.usuario.telefono ?? "").includes(q) ||
      String(c.id_conversacion).includes(q);
    return coincide && (filtro === "Todas" || c.estado === filtro);
  }), [conversaciones, busqueda, filtro]);

  const conteoAbiertas = conversaciones.filter(c => c.estado === "Abierta").length;
  const conteoBloqueadas = conversaciones.filter(c => c.estado === "Bloqueada").length;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!seleccionada || !texto.trim() || enviando || actual?.estado !== "Abierta") return;
    setEnviando(true);
    setError("");
    try {
      await api.post(`/chat/conversacion/${seleccionada}/mensajes`, {
        mensaje: texto.trim()
      });
      setTexto("");
      await cargarMensajes(seleccionada);
      await cargarConversaciones();
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? "No se pudo enviar la respuesta.");
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(estado: "Abierta" | "Cerrada" | "Bloqueada") {
    if (!seleccionada || !actual) return;
    setError("");
    setAviso("");
    try {
      await api.patch(`/chat/admin/conversaciones/${seleccionada}/estado`, { estado });
      await cargarConversaciones();
      setAviso(
        estado === "Bloqueada" ? "Cliente bloqueado correctamente." :
        estado === "Abierta" ? "Conversación reabierta correctamente." :
        "Conversación cerrada correctamente."
      );
      setMenuAbierto(false);
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? "No se pudo actualizar el estado.");
    }
  }

  async function eliminarConversacion() {
    if (!seleccionada) return;
    setError("");
    try {
      await api.delete(`/chat/admin/conversaciones/${seleccionada}`);
      setConversaciones(actuales => actuales.filter(c => c.id_conversacion !== seleccionada));
      setSeleccionada(null);
      setMensajes([]);
      setTexto("");
      setConfirmarEliminar(false);
      setMenuAbierto(false);
      setAviso("Conversación eliminada. Sus mensajes asociados también se eliminaron.");
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? "No se pudo eliminar la conversación.");
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-slate-300">Verificando permisos...</div>;
  }

  if (!user) {
    return <div className="m-8 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-slate-200">Inicia sesión para continuar. <Link className="text-cyan-400 underline" to="/login">Ingresar</Link></div>;
  }

  if (!isAdmin) {
    return <div className="m-8 rounded-2xl border border-red-900 bg-slate-950 p-8 text-red-300">No tienes permisos para acceder a esta sección.</div>;
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#080d18] p-3 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Headphones size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">TEDIGSA · Atención</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Centro de mensajes</h1>
              <p className="mt-1 text-sm text-slate-400">Gestiona las consultas de tus clientes desde un solo lugar.</p>
            </div>
          </div>
          <button type="button" onClick={() => { void cargarConversaciones(); if (seleccionada) void cargarMensajes(seleccionada); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300">
            <RefreshCw size={16} /> Actualizar
          </button>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#101827] p-4">
            <p className="text-sm text-slate-400">Total de conversaciones</p>
            <p className="mt-2 text-3xl font-bold">{conversaciones.length}</p>
            <p className="mt-1 text-xs text-slate-500">Historial de atención</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <p className="flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Abiertas</p>
            <p className="mt-2 text-3xl font-bold">{conteoAbiertas}</p>
            <p className="mt-1 text-xs text-slate-500">Listas para responder</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
            <p className="flex items-center gap-2 text-sm text-rose-300"><LockKeyhole size={14} /> Bloqueadas</p>
            <p className="mt-2 text-3xl font-bold">{conteoBloqueadas}</p>
            <p className="mt-1 text-xs text-slate-500">Mensajes restringidos</p>
          </div>
        </div>

        {error && <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><span>{error}</span><button onClick={() => setError("")} aria-label="Cerrar error"><X size={17} /></button></div>}
        {aviso && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><span>{aviso}</span><button onClick={() => setAviso("")} aria-label="Cerrar aviso"><X size={17} /></button></div>}

        <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-800 bg-[#101827] shadow-2xl shadow-black/20 lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-slate-800 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-800 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">Bandeja de entrada</h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">{filtradas.length}</span>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#080d18] px-3 py-2.5 focus-within:border-cyan-500">
                <Search size={17} className="shrink-0 text-slate-500" />
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente, correo o ID..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" />
                {busqueda && <button type="button" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda"><X size={15} className="text-slate-500" /></button>}
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Todas", "Abierta", "Cerrada", "Bloqueada"].map(estado => (
                  <button key={estado} type="button" onClick={() => setFiltro(estado)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filtro === estado ? "bg-cyan-400 text-slate-950" : "border border-slate-700 bg-slate-900 text-slate-400 hover:text-white"}`}>
                    {estado}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[250px] flex-1 overflow-y-auto">
              {filtradas.map(c => {
                const ultimo = c.mensajes?.[0];
                const activo = seleccionada === c.id_conversacion;
                return (
                  <button key={c.id_conversacion} type="button" onClick={() => { setSeleccionada(c.id_conversacion); setError(""); setAviso(""); setMenuAbierto(false); }} className={`flex w-full items-start gap-3 border-b border-slate-800/80 p-4 text-left transition ${activo ? "bg-cyan-400/[0.09] ring-1 ring-inset ring-cyan-400/30" : "hover:bg-slate-800/60"}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.estado === "Bloqueada" ? "bg-rose-500/15 text-rose-300" : "bg-gradient-to-br from-cyan-500/25 to-blue-500/20 text-cyan-200"}`}>
                      {c.estado === "Bloqueada" ? <LockKeyhole size={17} /> : iniciales(c.usuario.nombre)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-100">{c.usuario.nombre}</span>
                        <span className="shrink-0 text-[10px] text-slate-500">{fechaHora(ultimo?.fecha_envio ?? c.fecha_actualizacion)}</span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-400">{c.usuario.email}</span>
                      <span className="mt-2 block truncate text-sm text-slate-400">{ultimo?.mensaje ?? "Todavía no hay mensajes"}</span>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.estado === "Abierta" ? "bg-emerald-500/10 text-emerald-300" : c.estado === "Bloqueada" ? "bg-rose-500/10 text-rose-300" : "bg-slate-700/70 text-slate-300"}`}>{c.estado}</span>
                    </span>
                  </button>
                );
              })}
              {!filtradas.length && <div className="px-6 py-12 text-center"><Inbox size={30} className="mx-auto text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-300">No hay conversaciones</p><p className="mt-1 text-xs text-slate-500">Prueba otro filtro o término de búsqueda.</p></div>}
            </div>
          </aside>

          <section className="flex min-h-[580px] min-w-0 flex-col bg-[#0b1220]">
            {actual ? <>
              <header className="relative flex items-center gap-3 border-b border-slate-800 bg-[#101827] px-4 py-4 sm:px-6">
                <button type="button" onClick={() => setSeleccionada(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Volver a la bandeja"><ArrowLeft size={19} /></button>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300"><UserRound size={21} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">{actual.usuario.nombre}</h2>
                  <p className="truncate text-xs text-slate-400">{actual.usuario.email}{actual.usuario.telefono ? ` · ${actual.usuario.telefono}` : ""}</p>
                  <p className={`mt-1 flex items-center gap-1.5 text-xs ${actual.estado === "Abierta" ? "text-emerald-300" : actual.estado === "Bloqueada" ? "text-rose-300" : "text-slate-400"}`}>
                    {actual.estado === "Abierta" ? <CheckCircle2 size={12} /> : actual.estado === "Bloqueada" ? <LockKeyhole size={12} /> : <Clock3 size={12} />}
                    {actual.estado} · Conversación #{actual.id_conversacion}
                  </p>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setMenuAbierto(v => !v)} aria-label="Acciones de conversación" className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-slate-300 hover:border-cyan-500 hover:text-cyan-300"><MoreVertical size={19} /></button>
                  {menuAbierto && <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-slate-700 bg-[#151f30] p-1.5 shadow-2xl">
                    {actual.estado === "Bloqueada" ? (
                      <button type="button" onClick={() => void cambiarEstado("Abierta")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-300 hover:bg-slate-800"><ShieldOff size={16} /> Desbloquear cliente</button>
                    ) : (
                      <button type="button" onClick={() => void cambiarEstado("Bloqueada")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-slate-800"><Shield size={16} /> Bloquear cliente</button>
                    )}
                    {actual.estado === "Abierta" ? (
                      <button type="button" onClick={() => void cambiarEstado("Cerrada")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800"><Clock3 size={16} /> Cerrar conversación</button>
                    ) : actual.estado === "Cerrada" ? (
                      <button type="button" onClick={() => void cambiarEstado("Abierta")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-300 hover:bg-slate-800"><CheckCircle2 size={16} /> Reabrir conversación</button>
                    ) : null}
                    <div className="my-1 border-t border-slate-700" />
                    <button type="button" onClick={() => { setConfirmarEliminar(true); setMenuAbierto(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/10"><Trash2 size={16} /> Eliminar conversación</button>
                  </div>}
                </div>
              </header>

              <div className="flex items-center gap-2 border-b border-slate-800/80 bg-cyan-400/[0.035] px-4 py-2.5 text-xs text-slate-400 sm:px-6">
                <MessageCircle size={14} className="text-cyan-400" />
                Los mensajes se actualizan automáticamente.
                <span className="ml-auto hidden sm:inline">Guardado en MySQL</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {mensajes.map(m => {
                  const propio = m.remitente === "Administrador";
                  return (
                    <div key={m.id_mensaje} className={`flex ${propio ? "justify-end" : "justify-start"}`}>
                      {!propio && <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400"><UserRound size={14} /></span>}
                      <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${propio ? "rounded-br-md border border-cyan-400/20 bg-cyan-500/10" : "rounded-bl-md border border-slate-700 bg-[#172235]"}`}>
                        <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${propio ? "text-cyan-300" : "text-slate-400"}`}>{propio ? "Tú · TEDIGSA" : actual.usuario.nombre}</p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{m.mensaje}</p>
                        <p className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">{fechaHora(m.fecha_envio)} {propio && <CheckCheck size={13} className="text-cyan-400" />}</p>
                      </div>
                    </div>
                  );
                })}
                {!mensajes.length && <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-slate-500"><MessageCircle size={30} /></div><p className="mt-4 font-semibold text-slate-300">Comienza la conversación</p><p className="mt-1 text-sm text-slate-500">Aquí aparecerán los mensajes del cliente.</p></div>}
              </div>

              {actual.estado === "Abierta" ? (
                <form onSubmit={enviar} className="border-t border-slate-800 bg-[#101827] p-3 sm:p-4">
                  <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-[#080d18] p-2 focus-within:border-cyan-500/60">
                    <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={4000} rows={2} placeholder="Escribe una respuesta al cliente..." onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} className="max-h-36 min-h-[48px] min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-5 text-slate-100 outline-none placeholder:text-slate-500" />
                    <button type="submit" disabled={enviando || !texto.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar respuesta">{enviando ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}</button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Enter para enviar · Shift + Enter para nueva línea · Máximo 4000 caracteres</p>
                </form>
              ) : (
                <div className={`border-t p-4 text-center text-sm ${actual.estado === "Bloqueada" ? "border-rose-500/20 bg-rose-500/[0.06] text-rose-200" : "border-slate-800 bg-slate-900 text-slate-400"}`}>
                  {actual.estado === "Bloqueada" ? <><LockKeyhole size={16} className="mr-2 inline" />Cliente bloqueado. Desbloquéalo desde el menú para habilitar los mensajes.</> : <>Esta conversación está cerrada. Puedes reabrirla desde el menú de acciones.</>}
                </div>
              )}
            </> : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300"><Inbox size={36} /></div>
                <h2 className="mt-5 text-xl font-bold">Tu bandeja de atención</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Selecciona una conversación para consultar el historial, responder al cliente o administrar el acceso al chat.</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} className="text-emerald-400" /> Sincronización automática activada</div>
              </div>
            )}
          </section>
        </div>
      </div>

      {confirmarEliminar && actual && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-eliminar" className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#101827] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300"><Trash2 size={23} /></div>
            <h2 id="titulo-eliminar" className="mt-4 text-xl font-bold">¿Eliminar esta conversación?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Se eliminará permanentemente el chat de <strong className="text-slate-200">{actual.usuario.nombre}</strong> y todos sus mensajes. Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmarEliminar(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancelar</button>
              <button type="button" onClick={() => void eliminarConversacion()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400"><Trash2 size={16} /> Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
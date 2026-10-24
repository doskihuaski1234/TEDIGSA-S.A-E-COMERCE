import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { ordenesApi } from '../services/api';

type DetallePedido = {
  id_producto: number;
  cantidad: number;
  subtotal: number | string;
  producto: { nombre: string };
};

type Pedido = {
  id_orden: number;
  fecha: string;
  estado: string;
  subtotal: number | string;
  impuestos: number | string;
  total: number | string;
  usuario: { nombre: string; email: string };
  direccion: {
    calle: string;
    ciudad: string;
    departamento: string;
    codigo_postal?: string | null;
  };
  detalles: DetallePedido[];
  pago: {
    estado: string;
    metodo_pago: string;
    monto: number | string;
  } | null;
};

type ProductoAdmin = {
  id_producto: number;
  nombre: string;
  precio: number | string;
  estado: string;
  inventario?: { cantidad_disponible: number } | null;
};

type ItemEditable = {
  id_producto: number | '';
  cantidad: string;
};

type FormularioPedido = {
  direccion: {
    calle: string;
    ciudad: string;
    departamento: string;
    codigo_postal: string;
  };
  items: ItemEditable[];
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const estados = [
  'Pendiente',
  'Confirmada',
  'Pagada',
  'En preparacion',
  'Enviada',
  'Entregada',
  'Cancelada',
];

const mensajeError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const moneda = (valor: number | string) =>
  `Q ${Number(valor).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fechaLegible = (valor: string) =>
  new Date(valor).toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const colorEstado = (estado: string) => {
  if (estado === 'Pendiente') return 'bg-amber-100 text-amber-800';
  if (estado === 'Confirmada') return 'bg-blue-100 text-blue-800';
  if (estado === 'Entregada') return 'bg-emerald-100 text-emerald-800';
  if (estado === 'Cancelada') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
};

export default function AdminPedidos() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [automatico, setAutomatico] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardandoModo, setGuardandoModo] = useState(false);
  const [pedidoActualizando, setPedidoActualizando] = useState<number | null>(null);
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null);
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [formulario, setFormulario] = useState<FormularioPedido | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await ordenesApi.all({
        page: meta.page,
        limit: meta.limit,
        ...(estadoFiltro ? { estado: estadoFiltro } : {}),
      });
      setPedidos(respuesta.data.data || []);
      setMeta((actual) => ({ ...actual, ...respuesta.data.meta }));
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los pedidos.'));
    } finally {
      setCargando(false);
    }
  }, [estadoFiltro, meta.limit, meta.page]);

  useEffect(() => {
    if (user && isAdmin) void cargarPedidos();
  }, [user, isAdmin, cargarPedidos]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    ordenesApi
      .getConfirmacionAutomatica()
      .then((respuesta) => setAutomatico(Boolean(respuesta.data.automatico)))
      .catch((err) => {
        setError(mensajeError(err, 'No se pudo consultar el modo de confirmación.'));
      });
  }, [user, isAdmin]);

  const cambiarModo = async () => {
    const nuevoModo = !automatico;
    setGuardandoModo(true);
    setError('');
    setMensaje('');
    try {
      const respuesta = await ordenesApi.setConfirmacionAutomatica(nuevoModo);
      setAutomatico(Boolean(respuesta.data.automatico));
      setMensaje(
        nuevoModo
          ? 'La confirmación automática quedó activada para los nuevos pedidos.'
          : 'La confirmación manual quedó activada para los nuevos pedidos.'
      );
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cambiar el modo de confirmación.'));
    } finally {
      setGuardandoModo(false);
    }
  };

  const confirmarPedido = async (pedido: Pedido) => {
    if (
      !window.confirm(
        `¿Confirmar el pedido #${pedido.id_orden} de ${pedido.usuario.nombre}?`
      )
    ) {
      return;
    }

    setPedidoActualizando(pedido.id_orden);
    setError('');
    setMensaje('');
    try {
      await ordenesApi.updateEstado(pedido.id_orden, 'Confirmada');
      setMensaje(`El pedido #${pedido.id_orden} quedó confirmado.`);
      await cargarPedidos();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo confirmar el pedido.'));
    } finally {
      setPedidoActualizando(null);
    }
  };

  const editarPedido = async (pedido: Pedido) => {
    setError('');
    try {
      const respuesta = await api.get('/catalogo/productos/administracion');
      setProductos(respuesta.data.data || []);
      setPedidoEditando(pedido);
      setFormulario({
        direccion: {
          calle: pedido.direccion.calle,
          ciudad: pedido.direccion.ciudad,
          departamento: pedido.direccion.departamento,
          codigo_postal: pedido.direccion.codigo_postal || '',
        },
        items: pedido.detalles.map((detalle) => ({
          id_producto: detalle.id_producto,
          cantidad: String(detalle.cantidad),
        })),
      });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el formulario de edición.'));
    }
  };

  const guardarEdicion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!pedidoEditando || !formulario) return;

    const items = formulario.items.map((item) => ({
      id_producto: Number(item.id_producto),
      cantidad: Number(item.cantidad),
    }));
    if (
      items.some(
        (item) =>
          !Number.isSafeInteger(item.id_producto) ||
          item.id_producto <= 0 ||
          !Number.isSafeInteger(item.cantidad) ||
          item.cantidad <= 0
      ) ||
      new Set(items.map((item) => item.id_producto)).size !== items.length
    ) {
      setError('Selecciona un producto y una cantidad válida para cada artículo, sin repetir productos.');
      return;
    }

    setGuardandoEdicion(true);
    setError('');
    setMensaje('');
    try {
      await ordenesApi.editAdmin(pedidoEditando.id_orden, {
        direccion: {
          calle: formulario.direccion.calle.trim(),
          ciudad: formulario.direccion.ciudad.trim(),
          departamento: formulario.direccion.departamento.trim(),
          codigo_postal: formulario.direccion.codigo_postal.trim() || undefined,
        },
        items,
      });
      setMensaje(`El pedido #${pedidoEditando.id_orden} quedó actualizado.`);
      setPedidoEditando(null);
      setFormulario(null);
      await cargarPedidos();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar el pedido.'));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const cancelarPedido = async (pedido: Pedido) => {
    if (
      !window.confirm(
        `¿Cancelar el pedido #${pedido.id_orden}? Las existencias se devolverán al inventario.`
      )
    ) {
      return;
    }

    setPedidoActualizando(pedido.id_orden);
    setError('');
    setMensaje('');
    try {
      await ordenesApi.cancelAdmin(pedido.id_orden);
      setMensaje(`El pedido #${pedido.id_orden} quedó cancelado y sus existencias fueron restauradas.`);
      await cargarPedidos();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cancelar el pedido.'));
    } finally {
      setPedidoActualizando(null);
    }
  };

  const cambiarCampoDireccion = (
    campo: keyof FormularioPedido['direccion'],
    valor: string
  ) => {
    setFormulario((actual) =>
      actual
        ? { ...actual, direccion: { ...actual.direccion, [campo]: valor } }
        : actual
    );
  };

  const cambiarItem = (
    indice: number,
    campo: keyof ItemEditable,
    valor: string
  ) => {
    setFormulario((actual) =>
      actual
        ? {
            ...actual,
            items: actual.items.map((item, itemIndice) =>
              itemIndice === indice
                ? {
                    ...item,
                    [campo]: campo === 'id_producto' && valor ? Number(valor) : valor,
                  }
                : item
            ),
          }
        : actual
    );
  };

  if (authLoading) {
    return <div className="mx-auto max-w-7xl p-8">Verificando permisos...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-2xl font-bold text-tedigsa-blue">Acceso restringido</h1>
        <p className="my-4">Inicia sesión con una cuenta autorizada para revisar pedidos.</p>
        <Link to="/login" className="btn-primary inline-block">Iniciar sesión</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-2xl font-bold text-tedigsa-blue">Sin permisos</h1>
        <p className="my-4">Tu cuenta no tiene permisos para administrar pedidos.</p>
        <Link to="/catalogo" className="btn-outline inline-block">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-tedigsa-orange">
              Administración TEDIGSA
            </p>
            <h1 className="mt-1 text-3xl font-bold text-tedigsa-blue">Registro de pedidos</h1>
            <p className="mt-2 text-slate-600">
              Revisa los pedidos y gestiona su confirmación.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/productos" className="btn-outline inline-flex items-center gap-2">
              Administración de productos
            </Link>
            <button
              type="button"
              onClick={() => void cargarPedidos()}
              disabled={cargando}
              className="btn-outline inline-flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={17} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {mensaje && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {mensaje}
          </div>
        )}

        {pedidoEditando && formulario && (
          <section className="mb-7 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-tedigsa-orange">
                  Corrección de pedido
                </p>
                <h2 className="mt-1 text-xl font-bold text-tedigsa-blue">
                  Editar pedido #{pedidoEditando.id_orden}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Los productos existentes conservan su precio. Los productos nuevos usan el precio actual y se ajusta el inventario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPedidoEditando(null);
                  setFormulario(null);
                }}
                aria-label="Cerrar edición"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="space-y-6">
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-2 text-sm font-bold text-slate-800">
                  Dirección de entrega
                </legend>
                {([
                  ['calle', 'Dirección completa'],
                  ['ciudad', 'Municipio o ciudad'],
                  ['departamento', 'Departamento'],
                  ['codigo_postal', 'Código postal (opcional)'],
                ] as const).map(([campo, etiqueta]) => (
                  <label key={campo} className={campo === 'calle' ? 'sm:col-span-2' : ''}>
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {etiqueta}
                    </span>
                    <input
                      required={campo !== 'codigo_postal'}
                      maxLength={
                        campo === 'calle' ? 150 :
                        campo === 'ciudad' || campo === 'departamento' ? 80 : 10
                      }
                      value={formulario.direccion[campo]}
                      onChange={(evento) => cambiarCampoDireccion(campo, evento.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <legend className="text-sm font-bold text-slate-800">Artículos del pedido</legend>
                  <button
                    type="button"
                    onClick={() =>
                      setFormulario((actual) =>
                        actual
                          ? { ...actual, items: [...actual.items, { id_producto: '', cantidad: '1' }] }
                          : actual
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={16} /> Agregar producto
                  </button>
                </div>
                <div className="space-y-3">
                  {formulario.items.map((item, indice) => (
                    <div key={indice} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_120px_auto]">
                      <label>
                        <span className="mb-1 block text-xs font-medium text-slate-600">Producto</span>
                        <select
                          required
                          value={item.id_producto}
                          onChange={(evento) => cambiarItem(indice, 'id_producto', evento.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                        >
                          <option value="">Selecciona un producto</option>
                          {productos
                            .filter((producto) =>
                              producto.estado === 'Publicado' ||
                              producto.id_producto === item.id_producto
                            )
                            .map((producto) => (
                              <option key={producto.id_producto} value={producto.id_producto}>
                                {producto.nombre} — {moneda(producto.precio)}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-medium text-slate-600">Cantidad</span>
                        <input
                          type="number"
                          required
                          min="1"
                          max="10000"
                          step="1"
                          value={item.cantidad}
                          onChange={(evento) => cambiarItem(indice, 'cantidad', evento.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormulario((actual) =>
                            actual
                              ? { ...actual, items: actual.items.filter((_, i) => i !== indice) }
                              : actual
                          )
                        }
                        disabled={formulario.items.length <= 1}
                        aria-label={`Quitar artículo ${indice + 1}`}
                        className="self-end rounded-lg border border-red-200 p-2.5 text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={17} />
                  {guardandoEdicion ? 'Guardando...' : 'Guardar correcciones'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPedidoEditando(null);
                    setFormulario(null);
                  }}
                  className="btn-outline"
                >
                  Descartar
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-tedigsa-blue">
                <Settings2 size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Confirmación de pedidos</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  {automatico
                    ? 'Los nuevos pedidos se confirman al registrarse.'
                    : 'Los nuevos pedidos quedan pendientes hasta que un administrador los confirme.'}
                  {' '}El estado del pago se mantiene independiente y no se marca como cobrado automáticamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={automatico}
              aria-label="Activar confirmación automática de nuevos pedidos"
              onClick={() => void cambiarModo()}
              disabled={guardandoModo}
              className={`inline-flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                automatico
                  ? 'border-blue-200 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span
                className={`relative h-6 w-11 rounded-full transition ${
                  automatico ? 'bg-blue-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    automatico ? 'left-5' : 'left-0.5'
                  }`}
                />
              </span>
              {guardandoModo ? 'Guardando...' : automatico ? 'Automática' : 'Manual'}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-orange-50 p-3 text-tedigsa-orange">
                <ClipboardList size={21} />
              </span>
              <div>
                <h2 className="font-bold text-tedigsa-blue">Pedidos recibidos</h2>
                <p className="text-sm text-slate-500">{meta.total} pedidos</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Filtrar por estado
              <select
                value={estadoFiltro}
                onChange={(evento) => {
                  setEstadoFiltro(evento.target.value);
                  setMeta((actual) => ({ ...actual, page: 1 }));
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">Todos</option>
                {estados.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </label>
          </div>

          {cargando ? (
            <p className="py-12 text-center text-slate-500">Cargando pedidos...</p>
          ) : pedidos.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <ClipboardList className="mx-auto text-slate-300" size={42} />
              <h3 className="mt-4 font-semibold text-slate-800">No hay pedidos para mostrar</h3>
              <p className="mt-1 text-sm text-slate-500">
                {estadoFiltro ? 'Prueba con otro filtro de estado.' : 'Los pedidos nuevos aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Pedido</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Artículos</th>
                      <th className="px-5 py-3">Entrega</th>
                      <th className="px-5 py-3">Pago</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id_orden} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-bold text-tedigsa-blue">#{pedido.id_orden}</p>
                          <p className="mt-1 text-xs text-slate-500">{fechaLegible(pedido.fecha)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{pedido.usuario.nombre}</p>
                          <p className="mt-1 text-xs text-slate-500">{pedido.usuario.email}</p>
                        </td>
                        <td className="max-w-64 px-5 py-4">
                          <ul className="space-y-1 text-slate-700">
                            {pedido.detalles.map((detalle, indice) => (
                              <li key={`${pedido.id_orden}-${indice}`}>
                                {detalle.cantidad} × {detalle.producto.nombre}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="max-w-56 px-5 py-4 text-slate-600">
                          {pedido.direccion.calle}, {pedido.direccion.ciudad},{' '}
                          {pedido.direccion.departamento}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{pedido.pago?.metodo_pago || 'No indicado'}</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Pago: {pedido.pago?.estado || 'Pendiente'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                          {moneda(pedido.total)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colorEstado(pedido.estado)}`}>
                            {pedido.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-40 flex-col items-start gap-2">
                            {pedido.estado === 'Pendiente' && (
                              <button
                                type="button"
                                onClick={() => void confirmarPedido(pedido)}
                                disabled={pedidoActualizando === pedido.id_orden}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-tedigsa-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                              >
                                <Check size={15} />
                                Confirmar pedido
                              </button>
                            )}
                            {['Pendiente', 'Confirmada'].includes(pedido.estado) &&
                              (!pedido.pago || pedido.pago.estado === 'Pendiente') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void editarPedido(pedido)}
                                    disabled={pedidoActualizando === pedido.id_orden || guardandoEdicion}
                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    <Pencil size={14} /> Editar pedido
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void cancelarPedido(pedido)}
                                    disabled={pedidoActualizando === pedido.id_orden}
                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                  >
                                    <Ban size={14} />
                                    {pedidoActualizando === pedido.id_orden ? 'Cancelando...' : 'Cancelar'}
                                  </button>
                                </>
                              )}
                            {!['Pendiente', 'Confirmada'].includes(pedido.estado) && (
                              <span className="text-xs text-slate-400">
                                {pedido.estado === 'Enviada' || pedido.estado === 'Entregada'
                                  ? 'No editable: pedido despachado'
                                  : 'Sin acciones disponibles'}
                              </span>
                            )}
                            {['Pendiente', 'Confirmada'].includes(pedido.estado) &&
                              pedido.pago?.estado !== undefined &&
                              pedido.pago.estado !== 'Pendiente' && (
                                <span className="text-xs text-slate-500">
                                  No editable: pago procesado
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Página {meta.page} de {Math.max(meta.pages, 1)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMeta((actual) => ({ ...actual, page: actual.page - 1 }))}
                    disabled={meta.page <= 1 || cargando}
                    className="btn-outline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <ChevronLeft size={17} /> Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeta((actual) => ({ ...actual, page: actual.page + 1 }))}
                    disabled={meta.page >= meta.pages || cargando}
                    className="btn-outline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    Siguiente <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ImageOff, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { catalogoApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Resena {
  id_resena: number;
  calificacion: number;
  comentario?: string | null;
  usuario?: { nombre: string };
}

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  sku: string;
  tipo: string;
  precio: number | string;
  imagen_url?: string | null;
  categoria?: { nombre: string };
  inventario?: { cantidad_disponible: number; cantidad_reservada: number } | null;
  resenas: Resena[];
}

const moneda = (valor: number) =>
  `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProductoDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState(false);
  const [imagenNoDisponible, setImagenNoDisponible] = useState(false);

  useEffect(() => {
    let activo = true;
    const idProducto = Number(id);

    setLoading(true);
    setError('');
    setProducto(null);

    if (!Number.isSafeInteger(idProducto) || idProducto <= 0) {
      setError('El enlace del producto no es válido.');
      setLoading(false);
      return () => {
        activo = false;
      };
    }

    catalogoApi.getProducto(idProducto)
      .then((respuesta) => {
        if (activo) setProducto(respuesta.data);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        setError(status === 404
          ? 'Este producto ya no está disponible.'
          : 'No pudimos cargar el producto. Revisa tu conexión e inténtalo de nuevo.');
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    setCantidad(1);
    setImagenNoDisponible(false);
    setConfirmacion(false);
  }, [id]);

  const agregarAlCarrito = async () => {
    if (!producto || agregando) return;
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setError('');
    setConfirmacion(false);
    setAgregando(true);
    try {
      await addItem(producto.id_producto, cantidad);
      setConfirmacion(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'No se pudo agregar el producto al carrito.');
    } finally {
      setAgregando(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid animate-pulse gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-slate-200" />
          <div className="space-y-5 py-4">
            <div className="h-5 w-1/3 rounded bg-slate-200" />
            <div className="h-10 w-4/5 rounded bg-slate-200" />
            <div className="h-8 w-1/3 rounded bg-slate-200" />
            <div className="h-24 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ImageOff size={42} className="mx-auto text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-tedigsa-blue">
          {error || 'Producto no encontrado'}
        </h1>
        <Link to="/catalogo" className="btn-primary mt-6">
          <ArrowLeft size={17} />
          Volver al catálogo
        </Link>
      </section>
    );
  }

  const precio = Number(producto.precio);
  const stock = Math.max(
    0,
    (producto.inventario?.cantidad_disponible ?? 0) -
      (producto.inventario?.cantidad_reservada ?? 0),
  );
  const resenas = Array.isArray(producto.resenas) ? producto.resenas : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-tedigsa-blue"
      >
        <ArrowLeft size={16} />
        Volver al catálogo
      </Link>

      <div className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          {producto.imagen_url && !imagenNoDisponible ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="h-full w-full object-contain"
              onError={() => setImagenNoDisponible(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <ImageOff size={48} strokeWidth={1.4} />
              <span className="text-sm">Imagen no disponible</span>
            </div>
          )}
          {producto.categoria?.nombre && (
            <span className="absolute left-4 top-4 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-tedigsa-blue">
              {producto.categoria.nombre}
            </span>
          )}
        </div>

        <section className="md:py-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-tedigsa-orange">
            {producto.tipo || 'Producto TEDIGSA'}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-tedigsa-blue sm:text-4xl">
            {producto.nombre}
          </h1>
          <p className="mt-3 text-sm text-slate-500">Código: {producto.sku}</p>

          {resenas.length > 0 && (
            <div className="mt-4 flex items-center gap-1" aria-label={`${resenas.length} reseñas`}>
              {Array.from({ length: 5 }, (_, indice) => (
                <Star
                  key={indice}
                  size={16}
                  className={indice < Math.round(resenas.reduce((suma, resena) => suma + resena.calificacion, 0) / resenas.length)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'}
                />
              ))}
              <span className="ml-2 text-sm text-slate-500">
                {resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>
          )}

          <p className="mt-5 text-3xl font-bold text-tedigsa-blue">
            {Number.isFinite(precio) ? moneda(precio) : 'Consultar precio'}
          </p>

          <p className="mt-4 flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={stock > 0 ? 'font-medium text-emerald-700' : 'text-slate-500'}>
              {stock > 0 ? `Disponible${stock <= 5 ? ` · ${stock} en inventario` : ''}` : 'Agotado'}
            </span>
          </p>

          {producto.descripcion && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold text-tedigsa-blue">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {producto.descripcion}
              </p>
            </div>
          )}

          {stock > 0 && (
            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
              <div className="inline-flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setCantidad((valor) => Math.max(1, valor - 1))}
                  disabled={cantidad <= 1 || agregando}
                  aria-label="Reducir cantidad"
                  className="flex h-11 w-11 items-center justify-center text-slate-600 hover:text-tedigsa-blue disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-8 text-center font-semibold" aria-live="polite">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad((valor) => Math.min(stock, valor + 1))}
                  disabled={cantidad >= stock || agregando}
                  aria-label="Aumentar cantidad"
                  className="flex h-11 w-11 items-center justify-center text-slate-600 hover:text-tedigsa-blue disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => void agregarAlCarrito()}
                disabled={agregando}
                className="btn-primary min-h-12 flex-1"
              >
                <ShoppingCart size={18} />
                {agregando ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>
          )}

          {confirmacion && (
            <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              <Check size={17} />
              Agregado al carrito.
              <Link to="/carrito" className="ml-auto underline">Ver carrito</Link>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      </div>

      {resenas.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-tedigsa-blue">Opiniones de clientes</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resenas.map((resena) => (
              <article key={resena.id_resena} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-1" aria-label={`${resena.calificacion} de 5 estrellas`}>
                  {Array.from({ length: Math.min(Math.max(resena.calificacion, 0), 5) }, (_, indice) => (
                    <Star key={indice} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-700">{resena.usuario?.nombre}</span>
                </div>
                {resena.comentario && <p className="mt-3 text-sm leading-6 text-slate-600">{resena.comentario}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

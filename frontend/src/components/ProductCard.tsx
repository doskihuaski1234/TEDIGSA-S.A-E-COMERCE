import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Camera,
  ShieldCheck,
  ImageOff,
  ArrowUpRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  imagen_url?: string | null;
  tipo?: string;
  inventario?: { cantidad_disponible: number; cantidad_reservada?: number } | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [imagenFallida, setImagenFallida] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const imagen = product.imagen_url?.trim() || '';
  const precio = Number(product.precio);
  const precioValido = Number.isFinite(precio) && precio >= 0;
  const stock = Math.max(
    0,
    (product.inventario?.cantidad_disponible ?? 0) -
      (product.inventario?.cantidad_reservada ?? 0),
  );

  useEffect(() => {
    setImagenFallida(false);
  }, [imagen]);

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (agregando || stock <= 0) return;

    try {
      setAgregando(true);
      setMensaje('');
      await addItem(product.id_producto, 1);
      setMensaje('Agregado al carrito');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
      };

      setMensaje(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No fue posible agregar el producto al carrito.'
      );
    } finally {
      setAgregando(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-tedigsa-orange/50 hover:shadow-xl hover:shadow-slate-900/10">
      <Link
        to={`/producto/${product.id_producto}`}
        aria-label={`Ver detalles de ${product.nombre}`}
        className="relative block aspect-square overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 focus-visible:z-10"
      >
        {imagen && !imagenFallida ? (
          <img
            src={imagen}
            alt={product.nombre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105 sm:p-5"
            onError={() => setImagenFallida(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-tedigsa-blue shadow-sm">
              {imagenFallida ? (
                <ImageOff size={36} strokeWidth={1.5} />
              ) : (
                <Camera size={38} strokeWidth={1.4} />
              )}
            </div>
            <span className="text-sm font-semibold text-slate-500">
              Fotografía del producto
            </span>
            <span className="text-xs text-slate-400">
              {imagenFallida
                ? 'La imagen no está disponible'
                : 'Imagen pendiente de agregar'}
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1 text-xs font-bold tracking-wide text-tedigsa-blue shadow-sm backdrop-blur">
          <ShieldCheck size={13} className="text-tedigsa-blue" />
            TEDIGSA
          </span>
        </div>

        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-tedigsa-blue opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100">
          <ArrowUpRight size={17} />
        </div>

        {stock <= 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-3 py-2 text-center text-xs font-semibold text-white">
            No disponible
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link
          to={`/producto/${product.id_producto}`}
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-tedigsa-blue transition hover:text-tedigsa-orange"
        >
          {product.nombre}
        </Link>

        {product.descripcion && (
          <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-4 text-slate-500">
            {product.descripcion}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <span className="block text-xs text-slate-400">Precio</span>
            <span className="text-lg font-extrabold tracking-tight text-tedigsa-blue sm:text-xl">
              {precioValido
                ? `Q ${precio.toLocaleString('es-GT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : 'Consultar'}
            </span>
          </div>

          {stock > 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={agregando}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tedigsa-orange text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tedigsa-orange focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              title="Agregar al carrito"
              aria-label={`Agregar ${product.nombre} al carrito`}
            >
              <ShoppingCart size={18} />
              <span className="sr-only">Agregar al carrito</span>
            </button>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-500">
              Agotado
            </span>
          )}
        </div>

        {product.tipo?.toLowerCase().includes('servicio') && (
          <span className="mt-3 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-tedigsa-blue">
            Servicio de instalación
          </span>
        )}
        {mensaje && (
          <p
            role={mensaje === 'Agregado al carrito' ? 'status' : 'alert'}
            className={`mt-3 text-xs font-medium ${mensaje === 'Agregado al carrito' ? 'text-emerald-700' : 'text-red-600'}`}
          >
            {mensaje}
          </p>
        )}
      </div>
    </article>
  );
}

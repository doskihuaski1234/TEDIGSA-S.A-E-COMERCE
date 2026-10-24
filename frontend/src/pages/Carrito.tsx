import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ImageOff, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const moneda = (valor: number) =>
  `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Carrito() {
  const { items, subtotal, updateItem, removeItem, loading, error, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [itemProcesando, setItemProcesando] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState('');

  const impuestos = subtotal * 0.12;
  const total = subtotal + impuestos;

  const actualizarCantidad = async (id: number, cantidad: number) => {
    setErrorAccion('');
    setItemProcesando(id);
    try {
      await updateItem(id, cantidad);
    } catch (err) {
      console.error('No se pudo actualizar el carrito:', err);
      setErrorAccion('No se pudo actualizar este producto. Inténtalo de nuevo.');
    } finally {
      setItemProcesando(null);
    }
  };

  const eliminarProducto = async (id: number) => {
    setErrorAccion('');
    setItemProcesando(id);
    try {
      await removeItem(id);
    } catch (err) {
      console.error('No se pudo quitar el producto del carrito:', err);
      setErrorAccion('No se pudo quitar este producto. Inténtalo de nuevo.');
    } finally {
      setItemProcesando(null);
    }
  };

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag size={42} className="mx-auto text-tedigsa-blue" />
        <h1 className="mt-4 text-2xl font-bold text-tedigsa-blue">Inicia sesión para ver tu carrito</h1>
        <p className="mt-2 text-sm text-slate-500">Accede a tu cuenta para continuar con tu compra.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: location.pathname } })}
          className="btn-primary mt-6"
        >
          Iniciar sesión
        </button>
      </section>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-12">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="mt-8 h-36 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (items.length === 0 && !error) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag size={46} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-tedigsa-blue">Tu carrito está vacío</h1>
        <p className="mt-2 text-slate-500">Explora el catálogo y agrega los productos que necesitas.</p>
        <Link to="/catalogo" className="btn-primary mt-6">
          Explorar catálogo
        </Link>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-tedigsa-blue"
      >
        <ArrowLeft size={16} />
        Seguir comprando
      </Link>

      <div className="mb-7 mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-tedigsa-orange">Tu compra</p>
          <h1 className="mt-1 text-3xl font-bold text-tedigsa-blue">Carrito</h1>
        </div>
        <p className="text-sm text-slate-500">
          {items.reduce((cantidad, item) => cantidad + item.cantidad, 0)} artículos
        </p>
      </div>

      {(error || errorAccion) && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{errorAccion || error}</span>
          {error && (
            <button
              type="button"
              onClick={() => void refresh().catch(() => undefined)}
              className="font-semibold underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
          <section aria-label="Productos en el carrito" className="space-y-3">
            {items.map((item) => {
              const precio = Number(item.producto.precio);
              const inventario = item.producto.inventario;
              const stockMaximo = inventario
                ? Math.max(
                    item.cantidad,
                    inventario.cantidad_disponible -
                      (inventario.cantidad_reservada ?? item.cantidad) +
                      item.cantidad,
                  )
                : Number.POSITIVE_INFINITY;
              const procesando = itemProcesando === item.id_carrito_item;

              return (
                <article
                  key={item.id_carrito_item}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
                >
                  <Link
                    to={`/producto/${item.producto.id_producto}`}
                    className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-24 sm:w-24"
                    aria-label={`Ver ${item.producto.nombre}`}
                  >
                    {item.producto.imagen_url ? (
                      <img
                        src={item.producto.imagen_url}
                        alt=""
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ImageOff size={26} className="text-slate-300" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/producto/${item.producto.id_producto}`}
                      className="line-clamp-2 font-semibold text-tedigsa-blue hover:text-tedigsa-orange"
                    >
                      {item.producto.nombre}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{moneda(precio)} por unidad</p>
                    <p className="mt-2 font-bold text-tedigsa-blue">{moneda(precio * item.cantidad)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="inline-flex h-10 items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => void actualizarCantidad(item.id_carrito_item, item.cantidad - 1)}
                        disabled={procesando}
                        aria-label={`Reducir cantidad de ${item.producto.nombre}`}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:text-tedigsa-blue disabled:opacity-40"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => void actualizarCantidad(item.id_carrito_item, item.cantidad + 1)}
                        disabled={procesando || item.cantidad >= stockMaximo}
                        aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:text-tedigsa-blue disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void eliminarProducto(item.id_carrito_item)}
                      disabled={procesando}
                      aria-label={`Quitar ${item.producto.nombre} del carrito`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-tedigsa-blue">Resumen del pedido</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Subtotal</span>
                <span>{moneda(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">IVA (12 %)</span>
                <span>{moneda(impuestos)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-4 text-base font-bold">
                <span>Total estimado</span>
                <span className="text-tedigsa-orange">{moneda(total)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              El total final y la disponibilidad se confirman al registrar el pedido.
            </p>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn-primary mt-5 w-full"
            >
              Continuar al checkout
            </button>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              <ShoppingBag size={15} className="mt-0.5 shrink-0 text-tedigsa-blue" />
              Revisa tu dirección y método de pago antes de confirmar el pedido.
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

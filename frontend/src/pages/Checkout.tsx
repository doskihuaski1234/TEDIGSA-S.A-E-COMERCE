import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { direccionesApi, ordenesApi } from '../services/api';

const moneda = (valor: number) =>
  `Q ${valor.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, subtotal, loading, refresh } = useCart();

  const [direccion, setDireccion] = useState({
    calle: '',
    ciudad: '',
    departamento: 'Santa Rosa',
    codigo_postal: '',
  });
  const [metodoPago, setMetodoPago] = useState('Contra entrega');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [ordenCreada, setOrdenCreada] = useState<{
    id: number;
    total: number;
    metodo: string;
    estado: string;
  } | null>(null);

  const impuestos = subtotal * 0.12;
  const total = subtotal + impuestos;

  const actualizarDireccion = (
    campo: keyof typeof direccion,
    valor: string
  ) => {
    setDireccion((actual) => ({ ...actual, [campo]: valor }));
  };

  const finalizarCompra = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError('');

    if (!user) {
      setError('Inicia sesión para poder completar tu compra.');
      return;
    }

    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    if (metodoPago === 'Tarjeta') {
      setError(
        'El pago con tarjeta aún no está habilitado. No se registró el pedido ni se realizó ningún cobro; selecciona otro método de pago.'
      );
      return;
    }

    setProcesando(true);

    try {
      const respuestaDireccion = await direccionesApi.crear({
        calle: direccion.calle.trim(),
        ciudad: direccion.ciudad.trim(),
        departamento: direccion.departamento.trim(),
        codigo_postal: direccion.codigo_postal.trim() || undefined,
      });

      const idDireccion = Number(respuestaDireccion.data?.direccion?.id_direccion);

      if (!Number.isInteger(idDireccion) || idDireccion <= 0) {
        throw new Error('La dirección no devolvió un identificador válido.');
      }

      const respuestaOrden = await ordenesApi.crear({
        id_direccion: idDireccion,
        metodo_pago: metodoPago,
      });

      const orden = respuestaOrden.data?.orden;
      const idOrden = Number(orden?.id_orden);
      const totalOrden = Number(respuestaOrden.data?.total);

      if (!Number.isInteger(idOrden) || idOrden <= 0) {
        throw new Error('El servidor no devolvió el número de pedido.');
      }

      setOrdenCreada({
        id: idOrden,
        total: Number.isFinite(totalOrden) ? totalOrden : total,
        metodo: metodoPago,
        estado: String(orden?.estado || 'Pendiente'),
      });

      await refresh();
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo completar la compra. Inténtalo nuevamente.';

      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  if (!user) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-tedigsa-blue">Inicia sesión</h1>
        <p className="mt-3 text-tedigsa-gray">
          Debes iniciar sesión para registrar tu pedido.
        </p>
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

  if (ordenCreada) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-green-600" size={58} />
          <h1 className="mt-5 text-3xl font-bold text-tedigsa-blue">
            ¡Pedido registrado!
          </h1>
          <p className="mt-3 text-tedigsa-gray">
            Tu pedido se registró correctamente en TEDIGSA.
          </p>
          <div className="mt-7 rounded-xl bg-gray-50 p-5 text-left">
            <p className="text-sm text-gray-500">Número de pedido</p>
            <p className="text-2xl font-bold text-tedigsa-blue">
              #{ordenCreada.id}
            </p>
            <div className="mt-4 flex justify-between gap-4">
              <span className="text-gray-600">Total del pedido</span>
              <strong className="text-tedigsa-orange">
                {moneda(ordenCreada.total)}
              </strong>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-gray-600">Método de pago</span>
              <span className="text-right font-medium">{ordenCreada.metodo}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-gray-600">Estado del pedido</span>
              <strong className="text-right font-medium text-tedigsa-blue">
                {ordenCreada.estado}
              </strong>
            </div>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              El pago está pendiente de confirmación. Confirmar el pedido no
              procesa ni confirma un cobro bancario.
            </p>
          </div>
          <Link to="/catalogo" className="btn-primary mt-7 inline-flex">
            Seguir comprando
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return <div className="py-20 text-center text-tedigsa-gray">Cargando carrito...</div>;
  }

  if (items.length === 0) {
    return (
      <section className="px-4 py-20 text-center">
        <PackageCheck className="mx-auto text-tedigsa-gray" size={48} />
        <h1 className="mt-4 text-2xl font-bold text-tedigsa-blue">
          Tu carrito está vacío
        </h1>
        <Link to="/catalogo" className="btn-primary mt-6 inline-flex">
          Explorar catálogo
        </Link>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-tedigsa-orange">
          TEDIGSA E-Commerce
        </p>
        <h1 className="mt-2 text-3xl font-bold text-tedigsa-blue">
          Finalizar compra
        </h1>
        <p className="mt-2 text-tedigsa-gray">
          Completa los datos de entrega y revisa tu pedido antes de confirmarlo.
        </p>
      </div>

      <form onSubmit={finalizarCompra} className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-3 text-tedigsa-orange">
                <MapPin size={23} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-tedigsa-blue">
                  Dirección de entrega
                </h2>
                <p className="text-sm text-tedigsa-gray">
                  ¿Dónde deseas recibir tu pedido?
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Dirección completa
                </span>
                <input
                  required
                  maxLength={150}
                  autoComplete="street-address"
                  value={direccion.calle}
                  onChange={(e) => actualizarDireccion('calle', e.target.value)}
                  placeholder="Calle, número de casa, colonia o referencia"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-tedigsa-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Municipio o ciudad
                </span>
                <input
                  required
                  maxLength={80}
                  autoComplete="address-level2"
                  value={direccion.ciudad}
                  onChange={(e) => actualizarDireccion('ciudad', e.target.value)}
                  placeholder="Ej. Cuilapa"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-tedigsa-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Departamento
                </span>
                <input
                  required
                  maxLength={80}
                  autoComplete="address-level1"
                  value={direccion.departamento}
                  onChange={(e) => actualizarDireccion('departamento', e.target.value)}
                  placeholder="Ej. Santa Rosa"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-tedigsa-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Código postal (opcional)
                </span>
                <input
                  maxLength={10}
                  autoComplete="postal-code"
                  value={direccion.codigo_postal}
                  onChange={(e) => actualizarDireccion('codigo_postal', e.target.value)}
                  placeholder="Código postal"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-tedigsa-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-3 text-tedigsa-orange">
                <ShieldCheck size={23} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-tedigsa-blue">
                  Método de pago
                </h2>
                <p className="text-sm text-tedigsa-gray">
                  Selecciona cómo deseas pagar.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-tedigsa-orange">
                <input
                  type="radio"
                  name="metodo_pago"
                  value="Contra entrega"
                  checked={metodoPago === 'Contra entrega'}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mt-1 accent-orange-500"
                />
                <span>
                  <strong className="block text-tedigsa-blue">Pago contra entrega</strong>
                  <span className="mt-1 block text-sm text-tedigsa-gray">
                    Coordina el pago al recibir tu pedido. Confirma la disponibilidad
                    del servicio con TEDIGSA.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-tedigsa-orange">
                <input
                  type="radio"
                  name="metodo_pago"
                  value="Transferencia bancaria"
                  checked={metodoPago === 'Transferencia bancaria'}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mt-1 accent-orange-500"
                />
                <span>
                  <strong className="block text-tedigsa-blue">Transferencia bancaria</strong>
                  <span className="mt-1 block text-sm text-tedigsa-gray">
                    El pedido quedará pendiente mientras se coordinan las instrucciones
                    y la verificación de la transferencia.
                  </span>
                </span>
              </label>

              <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 opacity-80">
                <input
                  type="radio"
                  name="metodo_pago"
                  value="Tarjeta"
                  checked={metodoPago === 'Tarjeta'}
                  disabled
                  className="mt-1"
                />
                <CreditCard size={20} className="mt-0.5 shrink-0 text-gray-500" />
                <span>
                  <strong className="flex flex-wrap items-center gap-2 text-gray-700">
                    Tarjeta de crédito o débito
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                      No disponible
                    </span>
                  </strong>
                  <span className="mt-1 block text-sm text-gray-600">
                    Los pedidos con tarjeta no se aceptan hasta habilitar el procesamiento seguro del pago.
                  </span>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-tedigsa-blue">
            Resumen del pedido
          </h2>

          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id_carrito_item} className="flex justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">{item.producto.nombre}</p>
                  <p className="text-gray-500">Cantidad: {item.cantidad}</p>
                </div>
                <span className="shrink-0 font-medium">
                  {moneda(Number(item.producto.precio) * item.cantidad)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-tedigsa-gray">Subtotal</span>
              <span>{moneda(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-tedigsa-gray">IVA (12 %)</span>
              <span>{moneda(impuestos)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-gray-200 pt-4 text-lg font-bold">
              <span>Total</span>
              <span className="text-tedigsa-orange">{moneda(total)}</span>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={procesando}
            className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando ? 'Registrando pedido...' : 'Confirmar pedido'}
          </button>

          <Link to="/carrito" className="mt-4 block text-center text-sm text-tedigsa-gray hover:text-tedigsa-orange">
            Volver al carrito
          </Link>

          <p className="mt-5 text-center text-xs leading-5 text-gray-500">
            Al confirmar, se verificará la disponibilidad del inventario y se
            registrará tu pedido.
          </p>
        </aside>
      </form>
    </main>
  );
}
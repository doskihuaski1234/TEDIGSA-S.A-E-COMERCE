import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Camera,
  RefreshCw,
  ArrowRight,
  PackageSearch,
  X,
} from 'lucide-react';
import { catalogoApi } from '../services/api';
import ProductCard from '../components/ProductCard';

type Categoria = {
  id_categoria: number;
  nombre: string;
};

type MetaCatalogo = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type Producto = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  sku?: string;
  precio: number | string;
  imagen_url?: string | null;
  tipo?: string;
  estado?: string;
  inventario?: {
    cantidad_disponible: number;
    cantidad_reservada?: number;
  } | null;
  categoria?: {
    nombre: string;
  };
};

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get('search') || '');
  const [busquedaAplicada, setBusquedaAplicada] = useState(searchParams.get('search') || '');
  const [categoriaId, setCategoriaId] = useState(searchParams.get('categoria_id') || '');
  const [pagina, setPagina] = useState(Math.max(1, Number(searchParams.get('page')) || 1));
  const [meta, setMeta] = useState<MetaCatalogo>({ total: 0, page: 1, limit: 12, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCategorias, setErrorCategorias] = useState('');
  const [actualizando, setActualizando] = useState(false);

  const cargarCategorias = useCallback(async () => {
    try {
      const respuesta = await catalogoApi.getCategorias();
      setCategorias(Array.isArray(respuesta.data) ? respuesta.data : []);
      setErrorCategorias('');
    } catch (err) {
      console.error('No se pudieron cargar las categorías:', err);
      setCategorias([]);
      setErrorCategorias('No se pudieron cargar los filtros de categoría.');
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: Record<string, string | number> = { page: pagina, limit: 12 };

      if (busquedaAplicada.trim()) {
        params.search = busquedaAplicada.trim();
      }

      if (categoriaId) {
        params.categoria = categoriaId;
      }

      const respuesta = await catalogoApi.getProductos(params);
      const lista = respuesta.data?.data;

      setProductos(Array.isArray(lista) ? lista : []);
      setMeta(respuesta.data?.meta ?? { total: 0, page: pagina, limit: 12, pages: 0 });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'No fue posible cargar el catálogo. Verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  }, [busquedaAplicada, categoriaId, pagina]);

  useEffect(() => {
    void cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    const nuevaBusqueda = searchParams.get('search') || '';
    const nuevaCategoria = searchParams.get('categoria_id') || '';
    const nuevaPagina = Math.max(1, Number(searchParams.get('page')) || 1);

    setBusqueda(nuevaBusqueda);
    setBusquedaAplicada(nuevaBusqueda);
    setCategoriaId(nuevaCategoria);
    setPagina(nuevaPagina);
  }, [searchParams]);

  useEffect(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const buscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusquedaAplicada(busqueda.trim());
    setPagina(1);

    const nuevosParametros: Record<string, string> = {};
    if (busqueda.trim()) nuevosParametros.search = busqueda.trim();
    if (categoriaId) nuevosParametros.categoria_id = categoriaId;
    setSearchParams(nuevosParametros);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setBusquedaAplicada('');
    setCategoriaId('');
    setPagina(1);
    setSearchParams({});
  };

  const actualizar = () => {
    setActualizando(true);
    void cargarProductos();
  };

  const cambiarPagina = (nuevaPagina: number) => {
    const paginaSegura = Math.min(Math.max(nuevaPagina, 1), Math.max(meta.pages, 1));
    setPagina(paginaSegura);

    const nuevosParametros: Record<string, string> = {};
    if (busquedaAplicada) nuevosParametros.search = busquedaAplicada;
    if (categoriaId) nuevosParametros.categoria_id = categoriaId;
    if (paginaSegura > 1) nuevosParametros.page = String(paginaSegura);
    setSearchParams(nuevosParametros);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-white to-slate-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-20 -top-36 h-96 w-96 rounded-full bg-orange-100/60 blur-3xl" />
          <div className="absolute -bottom-48 left-1/4 h-72 w-72 rounded-full bg-blue-50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-[1.05fr_0.95fr] md:py-16 lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-tedigsa-blue shadow-sm">
              <ShieldCheck size={16} className="text-tedigsa-orange" />
              TECNOLOGÍA Y SEGURIDAD
            </div>

            <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-tedigsa-blue sm:text-4xl md:text-5xl">
              Encuentra la solución tecnológica que necesitas.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Explora nuestro catálogo de equipos de seguridad electrónica,
              videovigilancia, automatización y soluciones tecnológicas.
            </p>

            <a
              href="#productos"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-tedigsa-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Explorar catálogo
              <ArrowRight size={18} />
            </a>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={17} className="text-tedigsa-orange" />
                Seguridad electrónica
              </span>
              <span className="inline-flex items-center gap-2">
                <Camera size={17} className="text-tedigsa-orange" />
                Equipos tecnológicos
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-blue-100/70 blur-xl" />
            <img
              src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1000&q=85"
              alt="Espacio equipado con tecnología de seguridad inteligente"
              className="relative h-56 w-full rounded-2xl border border-slate-200 object-cover shadow-xl shadow-slate-900/10 sm:h-72 md:h-80 lg:h-96"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute -bottom-3 left-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-6">
              <p className="text-xs font-medium text-slate-500">Soluciones para tu seguridad</p>
              <p className="mt-1 font-bold text-tedigsa-blue">TEDIGSA S.A.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-tedigsa-orange">
              Tienda en línea
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-tedigsa-blue sm:text-3xl">
              Nuestro catálogo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Encuentra equipos y consulta sus detalles y disponibilidad.
            </p>
          </div>

          <button
            type="button"
            onClick={actualizar}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-tedigsa-blue transition hover:border-tedigsa-blue hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={16} className={actualizando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <form
          onSubmit={buscar}
          className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:grid-cols-[1fr_260px_auto] sm:p-5"
        >
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cámaras, alarmas, productos..."
              aria-label="Buscar productos"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-tedigsa-orange focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={categoriaId}
              onChange={(e) => {
                const valor = e.target.value;
                setCategoriaId(valor);
                setPagina(1);

                const nuevosParametros: Record<string, string> = {};
                if (busquedaAplicada) nuevosParametros.search = busquedaAplicada;
                if (valor) nuevosParametros.categoria_id = valor;
                setSearchParams(nuevosParametros);
              }}
              aria-label="Filtrar por categoría"
              className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-tedigsa-orange focus:bg-white focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tedigsa-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Search size={17} />
            Buscar
          </button>
        </form>
        {errorCategorias && (
          <p role="status" className="-mt-5 mb-6 text-sm text-amber-700">
            {errorCategorias}
          </p>
        )}

        <div id="productos" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Productos disponibles
              </h3>
              {!loading && !error && (
                <p className="mt-1 text-sm text-slate-500">
                  {meta.total} {meta.total === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
              )}
            </div>

            {(busquedaAplicada || categoriaId) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-tedigsa-orange"
              >
                <X size={16} />
                Limpiar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="aspect-square animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-8 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-white px-5 py-12 text-center">
              <PackageSearch size={40} className="mx-auto text-red-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No pudimos cargar los productos
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void cargarProductos()}
                className="mt-5 rounded-lg bg-tedigsa-orange px-5 py-2.5 font-semibold text-white hover:opacity-90"
              >
                Intentar nuevamente
              </button>
            </div>
          ) : productos.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
              <PackageSearch size={44} className="mx-auto text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No encontramos productos
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Prueba otra búsqueda o selecciona una categoría diferente.
              </p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-5 rounded-lg bg-tedigsa-blue px-5 py-2.5 font-semibold text-white hover:opacity-90"
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id_producto} product={producto} />
              ))}
            </div>
          )}
          {!loading && !error && meta.pages > 1 && (
            <nav
              aria-label="Paginación de productos"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <button
                type="button"
                onClick={() => cambiarPagina(pagina - 1)}
                disabled={pagina <= 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-tedigsa-blue transition hover:border-tedigsa-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600" aria-live="polite">
                Página {pagina} de {meta.pages}
              </span>
              <button
                type="button"
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={pagina >= meta.pages}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-tedigsa-blue transition hover:border-tedigsa-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-300">
                ¿Necesitas asesoría?
              </p>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                Te ayudamos a encontrar la solución adecuada.
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Consulta sobre equipos, características y soluciones para tus necesidades.
              </p>
            </div>
            <a
              href="https://wa.me/50230401481?text=Hola%2C%20necesito%20asesor%C3%ADa%20sobre%20los%20productos%20de%20TEDIGSA."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-tedigsa-orange px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Escribir por WhatsApp
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Fingerprint,
  House,
  PackageSearch,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { catalogoApi } from '../services/api';
import ProductCard from '../components/ProductCard';

interface ProductoInicio {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  imagen_url?: string | null;
  tipo?: string;
  inventario?: { cantidad_disponible: number; cantidad_reservada?: number } | null;
}

interface CategoriaInicio {
  id_categoria: number;
  nombre: string;
  _count?: { productos?: number };
}

const categoriasVisuales = [
  { match: ['cctv', 'alarma', 'cámara'], icono: Camera, color: 'bg-blue-50 text-blue-700' },
  { match: ['smart', 'hogar', 'domótica'], icono: House, color: 'bg-orange-50 text-orange-700' },
  { match: ['acceso', 'biométr'], icono: Fingerprint, color: 'bg-slate-100 text-tedigsa-blue' },
  { match: ['eléctr', 'instal'], icono: Zap, color: 'bg-orange-50 text-orange-700' },
];

export default function Home() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<ProductoInicio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarTienda() {
      const [resultadoProductos, resultadoCategorias] = await Promise.allSettled([
        catalogoApi.getProductos({ limit: 4 }),
        catalogoApi.getCategorias(),
      ]);

      if (!activo) return;

      if (resultadoProductos.status === 'fulfilled') {
        const datos = resultadoProductos.value.data?.data;
        setProductos(Array.isArray(datos) ? datos : []);
      } else {
        setProductos([]);
        setErrorCatalogo(true);
      }

      if (resultadoCategorias.status === 'fulfilled') {
        const datos = resultadoCategorias.value.data?.data ?? resultadoCategorias.value.data;
        setCategorias(Array.isArray(datos) ? datos : []);
      } else {
        setCategorias([]);
        setErrorCategorias(true);
      }

      setLoading(false);
    }

    void cargarTienda();
    return () => {
      activo = false;
    };
  }, []);

  const buscarProductos = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const termino = busqueda.trim();
    navigate(termino ? `/catalogo?search=${encodeURIComponent(termino)}` : '/catalogo');
  };

  return (
    <div className="bg-white">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-white to-slate-100">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-24 -top-40 h-[30rem] w-[30rem] rounded-full bg-orange-100/70 blur-3xl" />
          <div className="absolute -bottom-48 left-0 h-[24rem] w-[34rem] rounded-full bg-blue-50 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12 lg:px-8 lg:py-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-tedigsa-blue sm:text-sm">
              <span className="h-px w-8 bg-tedigsa-orange" />
              Seguridad inteligente · TEDIGSA
            </span>

            <h1 className="mt-5 max-w-2xl text-[2.55rem] font-bold leading-[1.08] tracking-tight text-tedigsa-blue sm:text-5xl lg:text-[3.65rem]">
              Tecnología que protege.{' '}
              <span className="text-tedigsa-orange">Confianza que conecta.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Soluciones de seguridad electrónica y automatización para tu hogar,
              negocio o proyecto.
            </p>

            <form
              onSubmit={buscarProductos}
              role="search"
              className="mt-7 flex max-w-xl rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 focus-within:border-tedigsa-orange focus-within:ring-4 focus-within:ring-orange-100"
            >
              <Search size={20} className="ml-3 mt-3 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="¿Qué estás buscando?"
                aria-label="Buscar productos"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-tedigsa-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 sm:px-5"
              >
                Buscar
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3 min-[420px]:flex-row">
              <Link
                to="/catalogo"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tedigsa-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Ver catálogo completo
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl md:pl-4">
            <div className="absolute -inset-4 rounded-[2rem] bg-blue-100/70 blur-2xl" />
            <div className="relative min-h-[19rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl shadow-slate-900/10 sm:min-h-[25rem]">
              <img
                src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=90"
                alt="Acceso a un espacio protegido con tecnología inteligente"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(evento) => {
                  evento.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-white/10" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-7">
                <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-tedigsa-blue shadow-sm backdrop-blur-sm sm:text-xs">
                  Soluciones TEDIGSA
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-tedigsa-blue shadow-sm backdrop-blur-sm">
                  <ShieldCheck size={20} />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
                  Tecnología para cada espacio
                </p>
                <h2 className="mt-2 max-w-sm text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Más control. Más tranquilidad.
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tedigsa-orange">
              Compra por categoría
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-tedigsa-blue sm:text-3xl">
              Encuentra lo que necesitas
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex w-fit items-center gap-2 py-2 text-sm font-bold text-tedigsa-blue transition hover:text-tedigsa-orange"
          >
            Ver todas las soluciones
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categorias.length > 0 ? (
            categorias.slice(0, 4).map((categoria, indice) => {
              const visual = categoriasVisuales.find((item) =>
                item.match.some((palabra) => categoria.nombre.toLocaleLowerCase().includes(palabra)),
              ) ?? categoriasVisuales[indice % categoriasVisuales.length];
              const Icono = visual.icono;

              return (
                <Link
                  key={categoria.id_categoria}
                  to={`/catalogo?categoria_id=${categoria.id_categoria}`}
                  className="group flex min-h-36 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-tedigsa-orange/40 hover:shadow-md sm:min-h-40 sm:p-5"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${visual.color}`}>
                    <Icono size={21} />
                  </span>
                  <span className="mt-4 line-clamp-2 text-sm font-bold text-tedigsa-blue sm:text-base">
                    {categoria.nombre}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {categoria._count?.productos ?? 0} productos
                  </span>
                </Link>
              );
            })
          ) : (
            <Link
              to="/catalogo"
              className="col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 p-5 text-sm font-semibold text-tedigsa-blue sm:col-span-4"
            >
              Explora todas las categorías en el catálogo
              <ArrowRight size={17} />
            </Link>
          )}
        </div>
        {errorCategorias && (
          <p role="status" className="mt-3 text-sm text-amber-700">
            No pudimos cargar las categorías. Puedes consultar todas las opciones en el catálogo.
          </p>
        )}
      </section>

      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-tedigsa-orange">
                Catálogo TEDIGSA
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-tedigsa-blue sm:text-3xl">
                Productos disponibles
              </h2>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Consulta precios y disponibilidad antes de agregar al carrito.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-tedigsa-blue transition hover:border-tedigsa-orange hover:text-tedigsa-orange"
            >
              Explorar catálogo
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-5 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, indice) => (
                <div key={indice} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="aspect-square animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : productos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-5 md:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id_producto} product={producto} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
              <PackageSearch size={34} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-bold text-tedigsa-blue">
                {errorCatalogo ? 'No pudimos cargar los productos' : 'Pronto habrá productos disponibles'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {errorCatalogo
                  ? 'Intenta nuevamente o visita el catálogo más tarde.'
                  : 'Puedes explorar las categorías y consultar el catálogo.'}
              </p>
              <Link to="/catalogo" className="btn-primary mt-5">
                Ir al catálogo
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

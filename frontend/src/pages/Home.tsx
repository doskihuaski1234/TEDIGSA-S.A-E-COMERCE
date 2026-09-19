import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogoApi } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      catalogoApi.getProductos({ limit: 8 }),
      catalogoApi.getCategorias(),
    ]).then(([prodRes, catRes]) => {
      setProductos(prodRes.data.data || []);
      setCategorias(catRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-tedigsa-blue text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-tedigsa-orange font-semibold text-sm uppercase tracking-wider mb-2">
              Empresa guatemalteca de confianza
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Protege tu Hogar con<br />
              <span className="text-tedigsa-orange">Tecnología de Vanguardia</span>
            </h1>
            <p className="text-gray-300 mb-8 max-w-md">
              Soluciones de seguridad, domótica y eléctrica. Productos físicos y servicios de instalación profesional.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
              <a href="https://wa.me/50212345678" target="_blank" rel="noreferrer" className="btn-outline border-white text-white hover:bg-white hover:text-tedigsa-blue">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['CCTV y Alarmas', 'Smart Home', 'Control de Acceso', 'Instalaciones Eléctricas'].map((c) => (
              <Link
                key={c}
                to={`/catalogo?categoria=${c}`}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-5 text-center font-medium transition backdrop-blur"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-tedigsa-blue mb-6">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorias.map((cat: any) => (
            <Link
              key={cat.id_categoria}
              to={`/catalogo?categoria_id=${cat.id_categoria}`}
              className="card p-6 text-center hover:shadow-md transition"
            >
              <div className="text-tedigsa-blue font-semibold">{cat.nombre}</div>
              <div className="text-tedigsa-gray text-sm mt-1">{cat._count?.productos || 0} productos</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-tedigsa-blue">Productos destacados</h2>
          <Link to="/catalogo" className="text-tedigsa-orange font-medium hover:underline">Ver todos →</Link>
        </div>
        {loading ? (
          <div className="text-center py-12 text-tedigsa-gray">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productos.map((p: any) => (
              <ProductCard key={p.id_producto} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

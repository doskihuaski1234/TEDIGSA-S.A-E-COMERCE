import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogoApi } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState(searchParams.get('categoria_id') || '');

  const load = () => {
    setLoading(true);
    const params: any = { limit: 24 };
    if (search) params.search = search;
    if (categoriaId) params.categoria = categoriaId;

    catalogoApi.getProductos(params)
      .then((res) => setProductos(res.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    catalogoApi.getCategorias().then((res) => setCategorias(res.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [categoriaId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-tedigsa-blue mb-6">Catálogo</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Buscar productos..."
          className="input-field flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <select
          className="input-field md:w-64"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c: any) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>
        <button onClick={load} className="btn-primary">Buscar</button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-tedigsa-gray">Cargando...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-16 text-tedigsa-gray">No se encontraron productos</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p: any) => (
            <ProductCard key={p.id_producto} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

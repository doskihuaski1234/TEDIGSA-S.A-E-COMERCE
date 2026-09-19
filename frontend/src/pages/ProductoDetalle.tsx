import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogoApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';

export default function ProductoDetalle() {
  const { id } = useParams();
  const [producto, setProducto] = useState<any>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      catalogoApi.getProducto(Number(id))
        .then((res) => setProducto(res.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleAdd = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await addItem(producto.id_producto, cantidad);
      alert('Producto agregado al carrito');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  if (loading) return <div className="text-center py-20 text-tedigsa-gray">Cargando...</div>;
  if (!producto) return <div className="text-center py-20 text-tedigsa-gray">Producto no encontrado</div>;

  const precio = Number(producto.precio);
  const stock = producto.inventario?.cantidad_disponible ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400">Sin imagen</span>
          )}
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-tedigsa-blue mb-2">{producto.nombre}</h1>
          <p className="text-tedigsa-orange text-3xl font-bold mb-4">
            Q {precio.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-tedigsa-gray mb-2">
            Disponibilidad:{' '}
            <span className={stock > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
              {stock > 0 ? `En stock (${stock})` : 'Agotado'}
            </span>
          </p>
          <p className="text-gray-600 mb-6">{producto.descripcion}</p>

          {stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button
                  className="px-3 py-2 text-lg"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                >
                  −
                </button>
                <span className="px-4 font-medium">{cantidad}</span>
                <button
                  className="px-3 py-2 text-lg"
                  onClick={() => setCantidad(Math.min(stock, cantidad + 1))}
                >
                  +
                </button>
              </div>
              <button onClick={handleAdd} className="btn-primary flex-1">
                Agregar al carrito
              </button>
            </div>
          )}

          {/* Reseñas */}
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-tedigsa-blue mb-4">Reseñas de clientes</h3>
            {producto.resenas?.length > 0 ? (
              producto.resenas.map((r: any) => (
                <div key={r.id_resena} className="mb-4 pb-4 border-b last:border-0">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: r.calificacion }).map((_, i) => (
                      <Star key={i} size={14} className="fill-tedigsa-orange text-tedigsa-orange" />
                    ))}
                    <span className="text-sm text-tedigsa-gray ml-2">{r.usuario?.nombre}</span>
                  </div>
                  <p className="text-sm text-gray-600">{r.comentario}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-tedigsa-gray">Aún no hay reseñas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

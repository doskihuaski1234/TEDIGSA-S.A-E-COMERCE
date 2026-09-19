import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id_producto: number;
  nombre: string;
  precio: number | string;
  imagen_url?: string;
  tipo?: string;
  inventario?: { cantidad_disponible: number };
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const precio = Number(product.precio);
  const stock = product.inventario?.cantidad_disponible ?? 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await addItem(product.id_producto, 1);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agregar');
    }
  };

  return (
    <Link to={`/producto/${product.id_producto}`} className="card group hover:shadow-md transition">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imagen_url ? (
          <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="text-gray-400 text-sm text-center px-4">{product.nombre}</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-tedigsa-blue text-sm line-clamp-2 min-h-[40px]">{product.nombre}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-tedigsa-orange font-bold text-lg">
            Q {precio.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </span>
          {stock > 0 ? (
            <button
              onClick={handleAdd}
              className="p-2 bg-tedigsa-orange text-white rounded-lg hover:bg-orange-600 transition"
              title="Agregar al carrito"
            >
              <ShoppingCart size={16} />
            </button>
          ) : (
            <span className="text-xs text-red-500 font-medium">Agotado</span>
          )}
        </div>
        {product.tipo === 'Servicio de instalacion' && (
          <span className="inline-block mt-2 text-xs bg-blue-100 text-tedigsa-blue px-2 py-0.5 rounded">Servicio</span>
        )}
      </div>
    </Link>
  );
}

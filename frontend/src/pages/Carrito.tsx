import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';

export default function Carrito() {
  const { items, subtotal, updateItem, removeItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const impuestos = subtotal * 0.12;
  const total = subtotal + impuestos;

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-tedigsa-gray mb-4">Debes iniciar sesión para ver tu carrito</p>
        <Link to="/login" className="btn-primary">Iniciar sesión</Link>
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-tedigsa-gray">Cargando carrito...</div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-tedigsa-gray mb-4">Tu carrito está vacío</p>
        <Link to="/catalogo" className="btn-primary">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-tedigsa-blue mb-6">Mi carrito</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id_carrito_item} className="card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-tedigsa-blue truncate">{item.producto.nombre}</h3>
                <p className="text-tedigsa-orange font-semibold">
                  Q {Number(item.producto.precio).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center border rounded-lg">
                <button className="px-2 py-1" onClick={() => updateItem(item.id_carrito_item, item.cantidad - 1)}>−</button>
                <span className="px-3 font-medium">{item.cantidad}</span>
                <button className="px-2 py-1" onClick={() => updateItem(item.id_carrito_item, item.cantidad + 1)}>+</button>
              </div>
              <button onClick={() => removeItem(item.id_carrito_item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="card p-6 h-fit">
          <h2 className="font-semibold text-tedigsa-blue mb-4">Resumen del pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-tedigsa-gray">Subtotal</span>
              <span>Q {subtotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tedigsa-gray">IVA (12%)</span>
              <span>Q {impuestos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-tedigsa-orange">Q {total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary w-full mt-6"
          >
            Continuar compra
          </button>
        </div>
      </div>
    </div>
  );
}

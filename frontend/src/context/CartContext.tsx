import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { carritoApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id_carrito_item: number;
  cantidad: number;
  producto: {
    id_producto: number;
    nombre: string;
    precio: number;
    imagen_url?: string;
    inventario?: { cantidad_disponible: number; cantidad_reservada?: number };
  };
}

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addItem: (id_producto: number, cantidad?: number) => Promise<void>;
  updateItem: (id: number, cantidad: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyCartResponse = (data: { items?: CartItem[]; subtotal?: number }) => {
    setItems(Array.isArray(data.items) ? data.items : []);
    setSubtotal(Number(data.subtotal) || 0);
    setError('');
  };

  const refresh = async () => {
    if (!token) {
      setItems([]);
      setSubtotal(0);
      setError('');
      return;
    }
    setLoading(true);
    try {
      const { data } = await carritoApi.get();
      applyCartResponse(data);
    } catch (err) {
      setError('No pudimos actualizar el carrito. Comprueba tu conexión e inténtalo de nuevo.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [token]);

  const addItem = async (id_producto: number, cantidad = 1) => {
    const { data } = await carritoApi.addItem(id_producto, cantidad);
    applyCartResponse(data);
  };

  const updateItem = async (id: number, cantidad: number) => {
    const { data } = await carritoApi.updateItem(id, cantidad);
    applyCartResponse(data);
  };

  const removeItem = async (id: number) => {
    const { data } = await carritoApi.removeItem(id);
    applyCartResponse(data);
  };

  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, subtotal, loading, error, refresh, addItem, updateItem, removeItem, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

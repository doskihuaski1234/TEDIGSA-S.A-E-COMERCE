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
    inventario?: { cantidad_disponible: number };
  };
}

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  loading: boolean;
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

  const refresh = async () => {
    if (!token) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const { data } = await carritoApi.get();
      setItems(data.items || []);
      setSubtotal(data.subtotal || 0);
    } catch {
      setItems([]);
      setSubtotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  const addItem = async (id_producto: number, cantidad = 1) => {
    await carritoApi.addItem(id_producto, cantidad);
    await refresh();
  };

  const updateItem = async (id: number, cantidad: number) => {
    await carritoApi.updateItem(id, cantidad);
    await refresh();
  };

  const removeItem = async (id: number) => {
    await carritoApi.removeItem(id);
    await refresh();
  };

  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider value={{ items, subtotal, loading, refresh, addItem, updateItem, removeItem, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

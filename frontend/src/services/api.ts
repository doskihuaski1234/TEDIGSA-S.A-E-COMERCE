import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tedigsa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tedigsa_token');
      localStorage.removeItem('tedigsa_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { nombre: string; email: string; password: string; telefono?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Catálogo
export const catalogoApi = {
  getCategorias: () => api.get('/catalogo/categorias'),
  getProductos: (params?: Record<string, any>) =>
    api.get('/catalogo/productos', { params }),
  getProducto: (id: number) => api.get(`/catalogo/productos/${id}`),
};

// Carrito
export const carritoApi = {
  get: () => api.get('/carrito'),
  addItem: (id_producto: number, cantidad = 1) =>
    api.post('/carrito/items', { id_producto, cantidad }),
  updateItem: (id: number, cantidad: number) =>
    api.put(`/carrito/items/${id}`, { cantidad }),
  removeItem: (id: number) => api.delete(`/carrito/items/${id}`),
};

// Órdenes
export const ordenesApi = {
  crear: (data: { id_direccion: number; id_cupon?: number; metodo_pago: string }) =>
    api.post('/ordenes', data),
  misOrdenes: () => api.get('/ordenes/mis-ordenes'),
  getById: (id: number) => api.get(`/ordenes/${id}`),
  all: (params?: Record<string, any>) => api.get('/ordenes', { params }),
  updateEstado: (id: number, estado: string) =>
    api.patch(`/ordenes/${id}/estado`, { estado }),
};

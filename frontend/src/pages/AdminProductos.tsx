import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, RefreshCw, Save, Search, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { catalogoApi } from '../services/api';

type Producto = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  sku: string;
  tipo: string;
  precio: number | string;
  imagen_url?: string | null;
  estado: string;
  id_categoria: number;
  categoria?: { nombre: string };
  inventario?: {
    cantidad_disponible: number;
    cantidad_reservada: number;
  } | null;
};

type Categoria = {
  id_categoria: number;
  nombre: string;
};

type Formulario = {
  nombre: string;
  descripcion: string;
  sku: string;
  tipo: string;
  precio: string;
  imagen_url: string;
  id_categoria: string;
  cantidad_disponible: string;
  estado: string;
};

const formularioVacio: Formulario = {
  nombre: '',
  descripcion: '',
  sku: '',
  tipo: 'Producto fisico',
  precio: '',
  imagen_url: '',
  id_categoria: '',
  cantidad_disponible: '0',
  estado: 'Publicado',
};

export default function AdminProductos() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formulario, setFormulario] = useState<Formulario>(formularioVacio);
  const [productoEditando, setProductoEditando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const [productosResponse, categoriasResponse] = await Promise.all([
        api.get('/catalogo/productos/administracion'),
        catalogoApi.getCategorias(),
      ]);

      setProductos(productosResponse.data.data || []);
      setCategorias(categoriasResponse.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'No se pudieron cargar los datos. Verifica que el backend esté funcionando y que tu cuenta tenga permisos.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      void cargarDatos();
    }
  }, [authLoading, user, isAdmin, cargarDatos]);

  const actualizarCampo = (campo: keyof Formulario, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const limpiarFormulario = () => {
    setImagenArchivo(null);
    setProductoEditando(null);
    setFormulario(formularioVacio);
    setError('');
    setMensaje('');
  };

  const editarProducto = (producto: Producto) => {
    setImagenArchivo(null);
    setProductoEditando(producto.id_producto);
    setFormulario({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      sku: producto.sku || '',
      tipo: producto.tipo || 'Producto fisico',
      precio: String(producto.precio ?? ''),
      imagen_url: producto.imagen_url || '',
      id_categoria: String(producto.id_categoria),
      cantidad_disponible: String(producto.inventario?.cantidad_disponible ?? 0),
      estado: producto.estado || 'Publicado',
    });
    setError('');
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const precio = Number(formulario.precio);
    const stock = Number(formulario.cantidad_disponible);
    const categoria = Number(formulario.id_categoria);

    if (!formulario.nombre.trim() || !formulario.sku.trim()) {
      setError('El nombre y el SKU son obligatorios.');
      return;
    }

    if (!Number.isFinite(precio) || precio < 0 || precio > 99999999.99) {
      setError('Ingresa un precio válido.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError('Las existencias deben ser un número entero igual o mayor que cero.');
      return;
    }

    if (!Number.isInteger(categoria) || categoria <= 0) {
      setError('Selecciona una categoría válida.');
      return;
    }

    if (formulario.imagen_url.trim() && !/^https?:\/\/\S+$/i.test(formulario.imagen_url.trim())) {
      setError('La imagen debe tener una URL que comience con http:// o https://.');
      return;
    }

    if (imagenArchivo && (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(imagenArchivo.type) ||
      imagenArchivo.size > 5 * 1024 * 1024
    )) {
      setError('Selecciona una imagen JPG, PNG, WEBP o GIF de máximo 5 MB.');
      return;
    }

    setGuardando(true);

    try {
      const datos = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || null,
        sku: formulario.sku.trim(),
        tipo: formulario.tipo,
        precio,
        imagen_url: formulario.imagen_url.trim() || null,
        id_categoria: categoria,
        estado: formulario.estado,
      };

      let idProducto: number;

      if (productoEditando === null) {
        const respuesta = await api.post('/catalogo/productos', {
          ...datos,
          cantidad_inicial: stock,
        });
        idProducto = Number(respuesta.data.id_producto);
        setMensaje('Producto registrado correctamente.');
      } else {
        await api.put(`/catalogo/productos/${productoEditando}`, datos);
        idProducto = productoEditando;

        await api.patch(`/catalogo/productos/${productoEditando}/inventario`, {
          cantidad_disponible: stock,
        });

        setMensaje('Producto actualizado correctamente.');
      }

      if (imagenArchivo) {
        const formData = new FormData();
        formData.append('imagen', imagenArchivo);

        await api.post(`/catalogo/productos/${idProducto}/imagen`, formData);
      }

      setImagenArchivo(null);
      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'No se pudo guardar el producto. Verifica los datos y los permisos de tu cuenta.'
      );
    } finally {
      setGuardando(false);
    }
  };
  const eliminarProducto = async (producto: Producto) => {
    const confirmado = window.confirm(
      `¿Deseas eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    setError('');
    setMensaje('');

    try {
      await api.delete(`/catalogo/productos/${producto.id_producto}`);

      if (productoEditando === producto.id_producto) {
        limpiarFormulario();
      }

      setMensaje(`Producto "${producto.nombre}" eliminado correctamente.`);
      await cargarDatos();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'No se pudo eliminar el producto.'
      );
    }
  };

  const cambiarEstado = async (producto: Producto) => {
    const nuevoEstado = producto.estado === 'Publicado' ? 'Desactivado' : 'Publicado';
    const accion = nuevoEstado === 'Publicado' ? 'publicar' : 'desactivar';

    if (!window.confirm(`¿Deseas ${accion} el producto "${producto.nombre}"?`)) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      await api.put(`/catalogo/productos/${producto.id_producto}`, {
        estado: nuevoEstado,
      });

      setMensaje(`Producto ${nuevoEstado === 'Publicado' ? 'publicado' : 'desactivado'} correctamente.`);
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo cambiar el estado del producto.');
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;

    return [
      producto.nombre,
      producto.sku,
      producto.categoria?.nombre || '',
      producto.estado,
    ].some((valor) => valor.toLowerCase().includes(texto));
  });

  if (authLoading) {
    return <div className="max-w-7xl mx-auto p-8">Verificando permisos...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-tedigsa-blue">Acceso restringido</h1>
        <p className="my-4">Inicia sesión con una cuenta autorizada para administrar productos.</p>
        <Link to="/login" className="btn-primary inline-block">Iniciar sesión</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-tedigsa-blue">Sin permisos</h1>
        <p className="my-4">Tu cuenta no tiene permisos para administrar el catálogo.</p>
        <Link to="/catalogo" className="btn-outline inline-block">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-tedigsa-orange">TEDIGSA S.A.</p>
            <h1 className="text-3xl font-bold text-tedigsa-blue">Administración de productos</h1>
            <p className="text-gray-600 mt-2">Gestiona el catálogo y las existencias de la tienda.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={limpiarFormulario} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Nuevo producto
            </button>
            <button type="button" onClick={() => void cargarDatos()} className="btn-outline inline-flex items-center gap-2">
              <RefreshCw size={17} /> Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        {mensaje && (
          <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {mensaje}
          </div>
        )}

        <section className="card p-5 sm:p-7 mb-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-tedigsa-blue">
              {productoEditando === null ? 'Registrar producto' : `Editar producto #${productoEditando}`}
            </h2>
            {productoEditando !== null && (
              <button type="button" onClick={limpiarFormulario} className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                <X size={16} /> Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={guardarProducto} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input className="input-field" maxLength={150} required value={formulario.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU único *</label>
              <input className="input-field" maxLength={30} required disabled={productoEditando !== null}
                value={formulario.sku} onChange={(e) => actualizarCampo('sku', e.target.value)}
                placeholder="Ej. CCTV-001" />
              {productoEditando !== null && <p className="text-xs text-gray-500 mt-1">El SKU no se modifica en la edición.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio (Q) *</label>
              <input className="input-field" type="number" min="0" max="99999999.99" step="0.01" required
                value={formulario.precio} onChange={(e) => actualizarCampo('precio', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select className="input-field" required value={formulario.id_categoria}
                onChange={(e) => actualizarCampo('id_categoria', e.target.value)}>
                <option value="">Selecciona una categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select className="input-field" value={formulario.tipo}
                onChange={(e) => actualizarCampo('tipo', e.target.value)}>
                <option value="Producto fisico">Producto físico</option>
                <option value="Servicio">Servicio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Existencias disponibles *</label>
              <input className="input-field" type="number" min="0" step="1" required
                value={formulario.cantidad_disponible}
                onChange={(e) => actualizarCampo('cantidad_disponible', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL de la imagen</label>
              <input className="input-field" type="url" maxLength={255}
                value={formulario.imagen_url}
                onChange={(e) => actualizarCampo('imagen_url', e.target.value)}
                placeholder="https://sitio.com/imagen.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fotografía del producto (máximo 5 MB)</label>
              <input
                className="input-field"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImagenArchivo(e.target.files?.[0] ?? null)}
              />
              {imagenArchivo && (
                <p className="mt-1 text-xs text-gray-600">
                  Archivo seleccionado: {imagenArchivo.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                La imagen se guardará en el servidor al registrar o guardar los cambios.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado de publicación</label>
              <select className="input-field" value={formulario.estado}
                onChange={(e) => actualizarCampo('estado', e.target.value)}>
                <option value="Publicado">Publicado</option>
                <option value="Borrador">Borrador</option>
                <option value="Desactivado">Desactivado</option>
              </select>
            </div>
            {formulario.imagen_url && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Vista previa de imagen</p>
                <img src={formulario.imagen_url} alt="Vista previa del producto"
                  className="h-36 w-36 rounded-lg border bg-white object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  onLoad={(e) => { e.currentTarget.style.display = 'block'; }} />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea className="input-field min-h-28" rows={4}
                value={formulario.descripcion}
                onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                placeholder="Características, especificaciones y detalles del producto..." />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" disabled={guardando} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={18} /> {guardando ? 'Guardando...' : productoEditando === null ? 'Registrar producto' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={limpiarFormulario} className="btn-outline">Limpiar formulario</button>
            </div>
          </form>
        </section>

        <section className="card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-tedigsa-blue">Inventario de productos</h2>
              <p className="text-sm text-gray-500 mt-1">
                {productosFiltrados.length} de {productos.length} productos
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-10" value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, SKU, categoría..." />
            </div>
          </div>

          {cargando ? (
            <p className="py-10 text-center text-gray-500">Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <p className="py-10 text-center text-gray-500">No se encontraron productos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Existencias</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id_producto} className="hover:bg-gray-50">
                      <td className="p-3 min-w-52">
                        <div className="flex items-center gap-3">
                          {producto.imagen_url ? (
                            <img src={producto.imagen_url} alt="" className="h-12 w-12 rounded border bg-white object-contain"
                              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                          ) : (
                            <div className="h-12 w-12 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{producto.nombre}</p>
                            <p className="text-xs text-gray-500">ID: {producto.id_producto}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{producto.sku}</td>
                      <td className="p-3">{producto.categoria?.nombre || 'Sin categoría'}</td>
                      <td className="p-3 whitespace-nowrap">Q {Number(producto.precio).toFixed(2)}</td>
                      <td className="p-3">{producto.inventario?.cantidad_disponible ?? 0}</td>
                      <td className="p-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          producto.estado === 'Publicado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>{producto.estado}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => editarProducto(producto)}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 hover:bg-gray-100">
                            <Pencil size={15} /> Editar
                          </button>
                          <button type="button" onClick={() => void cambiarEstado(producto)}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 hover:bg-gray-100">
                            {producto.estado === 'Publicado' ? 'Desactivar' : 'Publicar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void eliminarProducto(producto)}
                            title="Eliminar producto"
                            aria-label={`Eliminar ${producto.nombre}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

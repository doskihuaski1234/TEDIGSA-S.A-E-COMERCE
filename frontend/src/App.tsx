import WhatsAppFlotante from './components/WhatsAppFlotante';
import { Link, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Nosotros from './pages/Nosotros';
import Contacto from './pages/Contacto';
import AdminProductos from './pages/AdminProductos';
import AdminPedidos from './pages/AdminPedidos';
import AdminChat from './pages/AdminChat';

function Footer() {
  return (
    <footer className="mt-16 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_0.7fr_1fr] md:py-14 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tedigsa-orange text-lg font-black text-white">T</span>
            <span>TEDIGSA<span className="text-tedigsa-orange">.net</span></span>
          </Link>
          <p className="mt-4 text-sm font-medium text-slate-200">
            Tecnología · Innovación · Vanguardia
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
            Soluciones de seguridad electrónica, automatización y tecnología para
            proteger y conectar tus espacios.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Explora</h2>
          <nav className="flex flex-col gap-3 text-sm text-slate-400">
            <Link to="/" className="transition hover:text-tedigsa-orange">Inicio</Link>
            <Link to="/catalogo" className="transition hover:text-tedigsa-orange">Catálogo</Link>
            <Link to="/nosotros" className="transition hover:text-tedigsa-orange">Nosotros</Link>
            <Link to="/contacto" className="transition hover:text-tedigsa-orange">Contacto</Link>
          </nav>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">¿Listo para comenzar?</h2>
          <p className="text-sm leading-6 text-slate-400">
            Explora el catálogo y encuentra equipos para tu hogar, negocio o proyecto.
          </p>
          <Link
            to="/catalogo"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-tedigsa-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-white"
          >
            Explorar productos
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} TEDIGSA S.A. · Todos los derechos reservados.
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/admin/productos" element={<AdminProductos />} />
          <Route path="/admin/pedidos" element={<AdminPedidos />} />
          <Route path="/admin/chat" element={<AdminChat />} />
          <Route
            path="*"
            element={
              <section className="px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-tedigsa-blue">
                  Página no encontrada
                </h1>
                <p className="mt-2 text-tedigsa-gray">
                  La dirección que buscas no existe o ha cambiado.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-lg bg-tedigsa-orange px-5 py-3 font-semibold text-white hover:opacity-90"
                >
                  Volver al inicio
                </Link>
              </section>
            }
          />
        </Routes>

      <WhatsAppFlotante />
</main>
      <Footer />
    </div>
  );
}

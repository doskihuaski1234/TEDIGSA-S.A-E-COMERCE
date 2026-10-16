import { Link, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import Carrito from './pages/Carrito';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Nosotros from './pages/Nosotros';
import Contacto from './pages/Contacto';

function Footer() {
  return (
    <footer className="mt-16 bg-tedigsa-blue text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Link to="/" className="mb-2 inline-block text-lg font-bold">
            TEDIGSA<span className="text-tedigsa-orange">.net</span>
          </Link>
          <p className="text-sm text-gray-300">
            Tecnología · Innovación · Vanguardia
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            Plataforma de productos y soluciones de seguridad electrónica y automatización.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Enlaces</h2>
          <nav className="flex flex-col gap-2 text-sm text-gray-300">
            <Link to="/" className="transition hover:text-tedigsa-orange">Inicio</Link>
            <Link to="/catalogo" className="transition hover:text-tedigsa-orange">Catálogo</Link>
            <Link to="/nosotros" className="transition hover:text-tedigsa-orange">Nosotros</Link>
            <Link to="/contacto" className="transition hover:text-tedigsa-orange">Contacto</Link>
            <Link to="/carrito" className="transition hover:text-tedigsa-orange">Carrito</Link>
          </nav>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">TEDIGSA E-Commerce</h2>
          <p className="text-sm leading-6 text-gray-300">
            Consulta el catálogo y conoce las opciones disponibles en la plataforma.
          </p>
          <Link
            to="/catalogo"
            className="mt-4 inline-flex rounded-lg bg-tedigsa-orange px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Explorar productos
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} TEDIGSA S.A. · Plataforma E-Commerce
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
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
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
      </main>
      <Footer />
    </div>
  );
}

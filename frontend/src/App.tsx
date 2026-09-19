import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import ProductoDetalle from './pages/ProductoDetalle';
import Carrito from './pages/Carrito';
import Login from './pages/Login';

function Footer() {
  return (
    <footer className="bg-tedigsa-blue text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-bold text-lg mb-2">
            TEDIGSA<span className="text-tedigsa-orange">.net</span>
          </div>
          <p className="text-gray-300 text-sm">Tecnología · Innovación · Vanguardia</p>
          <p className="text-gray-400 text-xs mt-2">Empresa guatemalteca de soluciones de seguridad y automatización.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Enlaces</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-300">
            <a href="/" className="hover:text-tedigsa-orange">Inicio</a>
            <a href="/catalogo" className="hover:text-tedigsa-orange">Catálogo</a>
            <a href="/nosotros" className="hover:text-tedigsa-orange">Nosotros</a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contacto</h4>
          <p className="text-sm text-gray-300">WhatsApp: +502 1234-5678</p>
          <p className="text-sm text-gray-300">Email: info@tedigsa.net</p>
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-4 text-xs text-gray-400">
        © 2026 TEDIGSA S.A. — Proyecto de Graduación Ingeniería en Sistemas
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Login />} /> {/* Reutilizar o crear página separada */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-tedigsa-blue">Página en construcción</h1>
              <p className="text-tedigsa-gray mt-2">Esta sección se completará en la versión Beta</p>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-tedigsa-blue text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-tedigsa-orange rounded-lg flex items-center justify-center font-bold text-sm">
            T
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">TEDIGSA</span>
            <span className="text-tedigsa-orange font-bold">.net</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-tedigsa-orange transition">Inicio</Link>
          <Link to="/catalogo" className="hover:text-tedigsa-orange transition">Catálogo</Link>
          <Link to="/nosotros" className="hover:text-tedigsa-orange transition">Nosotros</Link>
          <Link to="/contacto" className="hover:text-tedigsa-orange transition">Contacto</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-tedigsa-orange transition">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/50212345678"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex bg-tedigsa-orange hover:bg-orange-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
          >
            WhatsApp
          </a>

          <Link to="/carrito" className="relative p-2 hover:bg-white/10 rounded-lg transition">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-tedigsa-orange text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-gray-300">{user.nombre.split(' ')[0]}</span>
              <button onClick={() => { logout(); navigate('/'); }} className="p-2 hover:bg-white/10 rounded-lg" title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="p-2 hover:bg-white/10 rounded-lg">
              <User size={20} />
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={22} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-tedigsa-blue border-t border-white/10 px-4 py-3 flex flex-col gap-3">
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</Link>
          <Link to="/nosotros" onClick={() => setMenuOpen(false)}>Nosotros</Link>
          <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
        </div>
      )}
    </header>
  );
}

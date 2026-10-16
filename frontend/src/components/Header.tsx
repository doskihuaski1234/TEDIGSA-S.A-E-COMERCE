import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navClass =
    'transition hover:text-tedigsa-orange';

  return (
    <header className="sticky top-0 z-50 bg-tedigsa-blue text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tedigsa-orange text-sm font-bold">
            T
          </span>
          <span className="text-lg font-bold tracking-tight">
            TEDIGSA<span className="text-tedigsa-orange">.net</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className={navClass}>Inicio</Link>
          <Link to="/catalogo" className={navClass}>Catálogo</Link>
          <Link to="/nosotros" className={navClass}>Nosotros</Link>
          <Link to="/contacto" className={navClass}>Contacto</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/carrito"
            aria-label="Ver carrito"
            className="relative rounded-lg p-2 transition hover:bg-white/10"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-tedigsa-orange px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-gray-300 sm:inline">
                {user.nombre.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate('/');
                }}
                className="rounded-lg p-2 transition hover:bg-white/10"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              className="rounded-lg p-2 transition hover:bg-white/10"
            >
              <User size={20} />
            </Link>
          )}

          <button
            type="button"
            className="rounded-lg p-2 transition hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-3 border-t border-white/10 bg-tedigsa-blue px-4 py-4 text-sm md:hidden">
          <Link to="/" onClick={closeMenu} className={navClass}>Inicio</Link>
          <Link to="/catalogo" onClick={closeMenu} className={navClass}>Catálogo</Link>
          <Link to="/nosotros" onClick={closeMenu} className={navClass}>Nosotros</Link>
          <Link to="/contacto" onClick={closeMenu} className={navClass}>Contacto</Link>
          <Link to="/carrito" onClick={closeMenu} className={navClass}>Carrito ({count})</Link>
          {!user && (
            <Link to="/login" onClick={closeMenu} className={navClass}>
              Iniciar sesión
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  UserRound,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Package,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5',
      'text-sm font-semibold transition-colors duration-150',
      isActive
        ? 'text-tedigsa-blue after:absolute after:inset-x-3 after:-bottom-[1.15rem] after:h-0.5 after:rounded-full after:bg-tedigsa-orange'
        : 'text-slate-600 hover:text-tedigsa-blue',
    ].join(' ');

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center justify-between rounded-xl px-4 py-3',
      'text-sm font-medium transition-colors',
      isActive
        ? 'bg-blue-50 text-tedigsa-blue ring-1 ring-blue-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-tedigsa-blue',
    ].join(' ');

  const links = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/catalogo', label: 'Catálogo', end: false },
    { to: '/nosotros', label: 'Nosotros', end: false },
    { to: '/contacto', label: 'Contacto', end: false },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/');
    } catch (error) {
      console.error('No fue posible cerrar la sesión:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-tedigsa-blue shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="hidden bg-tedigsa-blue text-white sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs font-medium lg:px-8">
          <p className="text-slate-200">Soluciones de seguridad, tecnología y automatización</p>
        </div>
      </div>
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-1 px-3 sm:gap-3 sm:px-6 lg:min-h-[76px] lg:px-8">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tedigsa-orange sm:gap-3"
          aria-label="TEDIGSA, ir al inicio"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tedigsa-blue text-lg font-black text-white shadow-sm ring-1 ring-inset ring-white/10 sm:h-11 sm:w-11 sm:text-xl">
            T
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-base font-bold leading-tight tracking-tight sm:text-xl">
              TEDIGSA<span className="text-tedigsa-orange">.net</span>
            </span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
              Seguridad y tecnología
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navClass}
            >
              {link.label}
            </NavLink>
          ))}

          {user && isAdmin && (
            <>
              <NavLink to="/admin/pedidos" className={navClass}>
                <ClipboardList size={16} />
                Pedidos
              </NavLink>
              <NavLink to="/admin/productos" className={navClass}>
                <ShieldCheck size={16} />
                Administración
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/carrito"
            onClick={closeMenu}
            aria-label={`Ver carrito, ${count} productos`}
            className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-2 text-tedigsa-blue transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tedigsa-orange sm:h-11 sm:px-3"
          >
            <ShoppingCart size={18} className="sm:h-5 sm:w-5" />
            <span className="hidden text-sm font-semibold sm:inline">
              Carrito
            </span>
            <span
              className={[
                'flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                count > 0
                  ? 'bg-tedigsa-orange text-white'
                  : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {count}
            </span>
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 xl:flex">
              <span
                className="max-w-32 truncate text-sm text-slate-600"
                title={user.nombre}
              >
                Hola, {user.nombre.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-tedigsa-blue"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="hidden h-11 items-center gap-2 rounded-xl bg-tedigsa-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-900 sm:inline-flex"
            >
              <UserRound size={17} />
              <span>Ingresar</span>
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="tedigsa-mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="tedigsa-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 shadow-xl lg:hidden sm:px-6"
        >
          <nav
            aria-label="Navegación móvil"
            className="mx-auto flex max-w-7xl flex-col gap-1.5"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={closeMenu}
                className={mobileNavClass}
              >
                {link.label}
                <ChevronRight size={16} className="opacity-60" />
              </NavLink>
            ))}

            {user && isAdmin && (
              <>
                <NavLink
                  to="/admin/pedidos"
                  onClick={closeMenu}
                  className={mobileNavClass}
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList size={17} />
                    Registro de pedidos
                  </span>
                  <ChevronRight size={16} className="opacity-60" />
                </NavLink>
                <NavLink
                  to="/admin/productos"
                  onClick={closeMenu}
                  className={mobileNavClass}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={17} />
                    Administración de productos
                  </span>
                  <ChevronRight size={16} className="opacity-60" />
                </NavLink>
              </>
            )}

            <NavLink
              to="/carrito"
              onClick={closeMenu}
              className={mobileNavClass}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={17} />
                Carrito de compras
                <span className="rounded-full bg-tedigsa-orange px-2 py-0.5 text-xs font-bold text-white">
                  {count}
                </span>
              </span>
              <ChevronRight size={16} className="opacity-60" />
            </NavLink>

            {user ? (
              <>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-tedigsa-blue">
                    <UserRound size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Sesión iniciada</p>
                    <p className="truncate text-sm font-semibold">
                      {user.nombre}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-tedigsa-blue"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-tedigsa-blue px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
              >
                <UserRound size={17} />
                Iniciar sesión
              </Link>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <Package size={14} />
              <span>Productos y soluciones TEDIGSA S.A.</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

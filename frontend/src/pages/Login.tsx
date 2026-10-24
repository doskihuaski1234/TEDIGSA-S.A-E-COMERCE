import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: unknown } | null)?.from;
      const destination =
        typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
          ? from
          : '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-tedigsa-blue rounded-xl items-center justify-center text-white font-bold text-xl mb-3">
            T
          </div>
          <h1 className="text-2xl font-bold text-tedigsa-blue">Iniciar sesión</h1>
          <p className="text-tedigsa-gray text-sm mt-1">Accede a tu cuenta TEDIGSA</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-secondary w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm text-tedigsa-gray mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-tedigsa-orange font-medium hover:underline">
            Regístrate
          </Link>
        </p>

      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (nombre.trim().length < 2) {
      setError('Escribe tu nombre completo.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);

    try {
      await register({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      const mensaje = err?.response?.data?.error;
      setError(
        typeof mensaje === 'string'
          ? mensaje
          : 'No se pudo crear la cuenta. Comprueba los datos e inténtalo nuevamente.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-tedigsa-blue">
            Crear cuenta
          </h1>
          <p className="mt-2 text-tedigsa-gray">
            Regístrate para comprar en TEDIGSA.
          </p>
        </div>

        <section className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
                Nombre completo *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                className="input-field w-full"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                minLength={2}
                required
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Correo electrónico *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="input-field w-full"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="telefono" className="mb-1 block text-sm font-medium">
                Teléfono (opcional)
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                autoComplete="tel"
                className="input-field w-full"
                placeholder="Tu número de teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="input-field w-full"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={enviando}
              />
            </div>

            <div>
              <label htmlFor="confirmacion" className="mb-1 block text-sm font-medium">
                Confirmar contraseña *
              </label>
              <input
                id="confirmacion"
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                className="input-field w-full"
                placeholder="Escribe nuevamente tu contraseña"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                required
                disabled={enviando}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-secondary w-full"
              disabled={enviando}
            >
              {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-tedigsa-gray">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-tedigsa-blue hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </section>

        <p className="mt-4 text-center text-xs text-tedigsa-gray">
          Los campos marcados con * son obligatorios.
        </p>
      </div>
    </main>
  );
}

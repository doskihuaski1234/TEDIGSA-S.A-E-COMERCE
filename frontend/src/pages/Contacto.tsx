import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquareText, PackageSearch, UserRound } from 'lucide-react';

const options = [
  {
    icon: PackageSearch,
    title: 'Consulta el catálogo',
    description: 'Explora los productos publicados y revisa sus características y disponibilidad.',
    link: '/catalogo',
    label: 'Ver productos',
  },
  {
    icon: UserRound,
    title: 'Accede a tu cuenta',
    description: 'Inicia sesión para acceder a las funciones de usuario disponibles en la plataforma.',
    link: '/login',
    label: 'Iniciar sesión',
  },
];

export default function Contacto() {
  return (
    <div className="min-h-[60vh] bg-gray-50">
      <section className="bg-tedigsa-blue text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <div className="flex items-center gap-3">
            <MessageSquareText className="text-tedigsa-orange" size={32} />
            <p className="text-sm font-semibold uppercase tracking-widest text-tedigsa-orange">
              Estamos para orientarte
            </p>
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Contacto</h1>
          <p className="mt-4 max-w-2xl leading-7 text-gray-300">
            Explora nuestros productos o accede a tu cuenta para continuar
            utilizando los servicios disponibles en TEDIGSA E-Commerce.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-tedigsa-blue">
            ¿Cómo podemos ayudarte?
          </h2>
          <p className="mt-3 leading-7 text-gray-600">
            Selecciona una de las siguientes opciones para continuar.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {options.map(({ icon: Icon, title, description, link, label }) => (
            <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <Icon size={30} className="text-tedigsa-orange" />
              <h3 className="mt-4 text-xl font-bold text-tedigsa-blue">{title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{description}</p>
              <Link
                to={link}
                className="mt-6 inline-flex items-center gap-2 font-semibold text-tedigsa-blue transition hover:text-tedigsa-orange"
              >
                {label} <ArrowRight size={18} />
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Los datos oficiales de teléfono, WhatsApp y correo deben confirmarse
          antes de publicarlos en esta página.
        </p>
      </section>
    </div>
  );
}

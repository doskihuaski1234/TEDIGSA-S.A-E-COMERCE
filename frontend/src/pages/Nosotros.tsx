import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, MonitorSmartphone, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: ShieldCheck,
    title: 'Seguridad',
    description: 'Soluciones tecnológicas orientadas a proteger espacios, equipos y personas.',
  },
  {
    icon: Cpu,
    title: 'Innovación',
    description: 'Tecnología de seguridad, automatización y domótica para diferentes necesidades.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Integración',
    description: 'Productos y soluciones que ayudan a conectar y administrar dispositivos.',
  },
];

export default function Nosotros() {
  return (
    <div className="bg-white">
      <section className="bg-tedigsa-blue text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-tedigsa-orange">
            Conoce TEDIGSA
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Tecnología para conectar, proteger e innovar.
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-gray-300">
            Una plataforma para explorar soluciones de seguridad electrónica,
            automatización y tecnología para distintos espacios y necesidades.
          </p>
          <Link
            to="/catalogo"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-tedigsa-orange px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Explorar catálogo <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-tedigsa-blue sm:text-3xl">
            Tecnología con propósito
          </h2>
          <p className="mt-5 leading-7 text-gray-600">
            TEDIGSA S.A. orienta su propuesta a productos y soluciones
            tecnológicas relacionadas con seguridad electrónica y automatización.
            Esta plataforma busca facilitar la consulta de productos y ofrecer
            una experiencia de compra clara y accesible.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-gray-200 p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tedigsa-blue text-tedigsa-orange">
                <Icon size={25} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-tedigsa-blue">{title}</h3>
              <p className="mt-2 leading-6 text-gray-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import { CheckIcon } from '@/components/icons.tsx'
import { PLANOS, formatarPreco } from '@/lib/planos.ts'
import { Link } from 'react-router-dom'

/**
 * Card do plano na lateral do dashboard.
 *
 * Mostra o plano em uso e convida para o premium. A contratação em si fica na
 * tela de Plano, que explica por que ainda não é possível assinar.
 */
export default function PainelPlano() {
  const premium = PLANOS.find((p) => p.id === 'premium')
  if (!premium) return null

  return (
    <section
      aria-labelledby="titulo-plano"
      className="rounded-card border border-brand-100 bg-brand-950 p-5 shadow-sm"
    >
      <div className="flex justify-center">
        <span className="inline-flex rounded-full bg-brand-800 px-3 py-1 text-xs font-medium text-brand-200">
          Upgrade para Versão Premium
        </span>
      </div>

      <h2 id="titulo-plano" className="mt-3 font-display text-xl font-bold text-white">
        Seja encontrada primeiro
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {premium.recursos.slice(1).map((recurso) => (
          <li key={recurso} className="flex gap-2 text-sm text-brand-200">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-400" />
            {recurso}
          </li>
        ))}
      </ul>

      <p className="mt-4 font-display text-2xl font-bold text-white">
        {formatarPreco(premium.preco)}
        <span className="text-sm font-medium text-brand-200">/mês</span>
      </p>

      <Link
        to="/dashboard/startup/plano"
        className="mt-4 block rounded-full bg-accent-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
      >
        Conhecer nosso Plano Premium
      </Link>
    </section>
  )
}

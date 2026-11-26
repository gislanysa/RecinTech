import { PLANOS, formatarPreco } from '@/lib/planos.ts'
import { Link } from 'react-router-dom'

/**
 * Card compacto de divulgação do plano premium na lateral do dashboard da startup.
 */
export default function PainelPlano() {
  const premium = PLANOS.find((p) => p.id === 'premium')
  if (!premium) return null

  return (
    <section
      aria-labelledby="titulo-plano"
      className="rounded-card bg-brand-950 p-4 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-plano" className="font-display text-sm font-bold text-white">
          Mais recursos
        </h2>
        <span className="text-xs font-semibold text-accent-300">
          {formatarPreco(premium.preco)}/mês
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-brand-200">
        Libere ferramentas e conteúdos exclusivos do plano pago.
      </p>

      <Link
        to="/dashboard/startup/plano"
        className="mt-3 block rounded-xl bg-accent-600 px-3 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
      >
        Conhecer Plano Premium
      </Link>
    </section>
  )
}


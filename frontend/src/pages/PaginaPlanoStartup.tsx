import { CheckIcon } from '@/components/icons.tsx'
import { PLANOS, PLANO_ATUAL, formatarPreco, type Plano } from '@/lib/planos.ts'

/**
 * Tela "Plano" da sidebar: compara o gratuito com o premium.
 *
 * A assinatura em si não existe. Não há campo de plano no banco, rota de
 * contratação nem meio de pagamento integrado, então o botão do premium fica
 * desligado com a razão escrita. Botão de pagamento que não cobra é pior que
 * botão nenhum.
 */
export default function PaginaPlanoStartup() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Plano
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Sua startup está no plano gratuito. O premium dá mais destaque para quem procura soluções.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {PLANOS.map((plano) => (
          <CartaoPlano key={plano.id} plano={plano} atual={plano.id === PLANO_ATUAL} />
        ))}
      </div>

      <p className="rounded-card border border-dashed border-brand-200 px-5 py-4 text-sm text-ink-500">
        A contratação do premium ainda não está disponível. A plataforma não tem meio de pagamento
        integrado, e todas as contas seguem no plano gratuito até que ele exista.
      </p>
    </div>
  )
}

function CartaoPlano({ plano, atual }: { plano: Plano; atual: boolean }) {
  const destaque = plano.id === 'premium'

  return (
    <section
      aria-labelledby={`plano-${plano.id}`}
      className={[
        'flex h-full flex-col rounded-card border bg-surface p-6 shadow-sm',
        destaque ? 'border-accent-500' : 'border-brand-100',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <h2 id={`plano-${plano.id}`} className="text-lg font-semibold">
          {plano.nome}
        </h2>
        {atual && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            Seu plano
          </span>
        )}
      </div>

      <p className="mt-2 font-display text-4xl font-bold text-ink-900">
        {formatarPreco(plano.preco)}
        {plano.preco > 0 && <span className="text-base font-medium text-ink-500">/mês</span>}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plano.recursos.map((recurso) => (
          <li key={recurso} className="flex gap-2 text-sm text-ink-700">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {recurso}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {atual ? (
          <p className="rounded-full border border-brand-100 px-4 py-2.5 text-center text-sm font-medium text-ink-500">
            Plano atual
          </p>
        ) : (
          <>
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
            >
              Assinar premium
            </button>
            <p className="mt-2 text-center text-xs text-ink-500">Disponível quando o pagamento existir.</p>
          </>
        )}
      </div>
    </section>
  )
}

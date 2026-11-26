import { CheckIcon } from '@/components/icons.tsx'
import { PLANOS, formatarPreco, type Plano } from '@/lib/planos.ts'
import { useState } from 'react'

const CHAVE_PLANO_STARTUP = 'recintech:plano_startup'
const CHAVE_CONTRATACOES_STARTUPS = 'recintech:planos_destaque_contratados'

export default function PaginaPlanoStartup() {
  const [planoAtivo, setPlanoAtivo] = useState<string>(() => {
    if (typeof window === 'undefined') return 'gratuito'
    return localStorage.getItem(CHAVE_PLANO_STARTUP) || 'gratuito'
  })
  const [feedback, setFeedback] = useState<string>('')

  function handleContratar(id: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAVE_PLANO_STARTUP, id)
      try {
        const raw = localStorage.getItem(CHAVE_CONTRATACOES_STARTUPS)
        const list = raw ? JSON.parse(raw) : []
        if (!list.includes('startup-sessao-atual')) {
          list.push('startup-sessao-atual')
          localStorage.setItem(CHAVE_CONTRATACOES_STARTUPS, JSON.stringify(list))
        }
      } catch {
        // silencia
      }
    }
    setPlanoAtivo(id)
    setFeedback('Plano Destaque contratado com sucesso! Sua startup agora ganha prioridade no ranking.')
  }

  function handleCancelar() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAVE_PLANO_STARTUP, 'gratuito')
      try {
        const raw = localStorage.getItem(CHAVE_CONTRATACOES_STARTUPS)
        const list = raw ? JSON.parse(raw) : []
        const filtrado = list.filter((item: string) => item !== 'startup-sessao-atual')
        localStorage.setItem(CHAVE_CONTRATACOES_STARTUPS, JSON.stringify(filtrado))
      } catch {
        // silencia
      }
    }
    setPlanoAtivo('gratuito')
    setFeedback('Assinatura do Plano Destaque cancelada.')
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Plano
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {planoAtivo === 'premium'
            ? 'Sua startup está com o Plano Destaque ativo com prioridade máxima.'
            : 'Sua startup está no plano gratuito. O premium dá mais destaque para quem procura soluções.'}
        </p>
      </header>

      {feedback && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs font-medium text-brand-800">
          {feedback}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {PLANOS.map((plano) => (
          <CartaoPlano
            key={plano.id}
            plano={plano}
            atual={plano.id === planoAtivo}
            onContratar={() => handleContratar(plano.id)}
            onCancelar={handleCancelar}
          />
        ))}
      </div>
    </div>
  )
}

function CartaoPlano({
  plano,
  atual,
  onContratar,
  onCancelar,
}: Readonly<{
  plano: Plano
  atual: boolean
  onContratar: () => void
  onCancelar: () => void
}>) {
  const destaque = plano.id === 'premium'

  let botaoAcao = (
    <button
      type="button"
      onClick={onContratar}
      className="w-full rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
    >
      Contratar Plano Destaque
    </button>
  )

  if (atual && plano.id === 'premium') {
    botaoAcao = (
      <button
        type="button"
        onClick={onCancelar}
        className="w-full rounded-full border border-brand-200 px-4 py-2.5 text-center text-sm font-medium text-ink-600 hover:bg-brand-50"
      >
        Cancelar plano destaque
      </button>
    )
  } else if (atual) {
    botaoAcao = (
      <p className="rounded-full border border-brand-100 bg-surface-2 px-4 py-2.5 text-center text-sm font-medium text-ink-500">
        Plano gratuito ativo
      </p>
    )
  }

  return (
    <section
      aria-labelledby={`plano-${plano.id}`}
      className={[
        'flex h-full flex-col rounded-card border bg-surface p-6 shadow-sm',
        destaque ? 'border-brand-300' : 'border-brand-100',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <h2 id={`plano-${plano.id}`} className="text-lg font-semibold text-ink-900">
          {plano.nome}
        </h2>
        {atual && (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-ink-700 border border-brand-100">
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
        {botaoAcao}
      </div>
    </section>
  )
}

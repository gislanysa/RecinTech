import Botao from '@/components/Botao.tsx'
import { CheckIcon } from '@/components/icons.tsx'
import type { Oportunidade } from '@/lib/oportunidades.ts'

export type EstadoDoCard = 'ocioso' | 'interessando' | 'ignorando' | 'interessado'

function corDaCompatibilidade(valor: number): string {
  if (valor >= 85) return 'bg-accent-600 text-white'
  if (valor >= 70) return 'bg-accent-100 text-accent-700'
  return 'bg-brand-100 text-brand-700'
}

export default function CartaoOportunidade({
  oportunidade,
  estado,
  onInteresse,
  onIgnorar,
}: {
  oportunidade: Oportunidade
  estado: EstadoDoCard
  onInteresse: () => void
  onIgnorar: () => void
}) {
  const ocupado = estado === 'interessando' || estado === 'ignorando'
  const interessado = estado === 'interessado'

  return (
    <li>
      <article
        aria-busy={ocupado}
        className={[
          'flex h-full flex-col gap-4 rounded-card border bg-surface p-5 transition-all',
          interessado ? 'border-brand-300' : 'border-brand-100 hover:-translate-y-0.5 hover:shadow-sm',
          estado === 'ignorando' ? 'opacity-50' : '',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-semibold text-ink-900">{oportunidade.empresa}</h3>
          <span
            className={[
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
              corDaCompatibilidade(oportunidade.compatibilidade),
            ].join(' ')}
          >
            {oportunidade.compatibilidade}%
            <span className="sr-only"> de compatibilidade</span>
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Demanda</p>
          <p className="mt-1 text-sm text-ink-700">{oportunidade.demanda}</p>
        </div>

        {oportunidade.tecnologias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {oportunidade.tecnologias.map((t) => (
              <span key={t} className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-700">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {interessado ? (
            <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
              <CheckIcon className="size-4" />
              Interesse registrado
            </p>
          ) : (
            <>
              <Botao disabled={ocupado} onClick={onInteresse}>
                {estado === 'interessando' ? 'Enviando…' : 'Tenho interesse'}
              </Botao>
              <button
                type="button"
                disabled={ocupado}
                onClick={onIgnorar}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {estado === 'ignorando' ? 'Ignorando…' : 'Ignorar'}
              </button>
            </>
          )}
        </div>
      </article>
    </li>
  )
}

export function CartaoOportunidadeCarregando() {
  return (
    <li className="animate-pulse rounded-card border border-brand-100 bg-surface p-5" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <div className="h-4 w-1/2 rounded bg-brand-100" />
        <div className="h-6 w-12 rounded-full bg-brand-100" />
      </div>
      <div className="mt-4 h-3 w-full rounded bg-brand-100" />
      <div className="mt-2 h-3 w-4/5 rounded bg-brand-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-10 w-36 rounded-full bg-brand-100" />
        <div className="h-10 w-20 rounded-full bg-brand-100" />
      </div>
    </li>
  )
}

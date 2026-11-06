import { BellIcon } from '@/components/icons.tsx'
import type { Conexao } from '@/lib/oportunidades.ts'

type Notificacao = {
  id: string
  texto: string
  quando: string
}

function formatarQuando(iso?: string): string {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/**
 * Notificações derivadas das conexões, não de uma fonte própria.
 *
 * O backend não tem tabela de notificação, e inventar uma lista solta seria
 * mostrar avisos que não correspondem a nada. Aqui cada aviso vem de um fato
 * que existe na conexão: a empresa respondeu, ou ainda não.
 */
function derivarNotificacoes(conexoes: Conexao[]): Notificacao[] {
  return conexoes
    .filter((c) => c.status !== 'pendente')
    .map((c) => ({
      id: c.id,
      texto:
        c.status === 'aceito'
          ? `${c.oportunidade.empresa} aceitou seu interesse`
          : `${c.oportunidade.empresa} não seguiu com seu interesse`,
      quando: formatarQuando(c.respondido_em ?? c.created_at),
    }))
}

export default function PainelNotificacoes({ conexoes }: { conexoes: Conexao[] | null }) {
  const notificacoes = conexoes === null ? [] : derivarNotificacoes(conexoes)

  return (
    <section
      aria-labelledby="titulo-notificacoes"
      className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <BellIcon className="size-5 text-brand-600" />
        <h2 id="titulo-notificacoes" className="text-lg font-semibold">
          Notificações
        </h2>
        {notificacoes.length > 0 && (
          <span className="ml-auto grid size-6 place-items-center rounded-full bg-accent-600 text-xs font-bold text-white">
            {notificacoes.length}
          </span>
        )}
      </div>

      {conexoes === null ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-brand-100" />
          ))}
        </div>
      ) : notificacoes.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          Nada por aqui ainda. Quando uma empresa responder ao seu interesse, o aviso aparece neste
          espaço.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {notificacoes.map((n) => (
            <li key={n.id} className="border-l-2 border-accent-500 pl-3">
              <p className="text-sm text-ink-900">{n.texto}</p>
              {n.quando && <p className="mt-0.5 text-xs text-ink-500">{n.quando}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

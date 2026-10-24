import Botao from '@/components/Botao.tsx'
import type { Conexao, StatusConexao } from '@/lib/oportunidades.ts'

/**
 * Resumo das conexões no dashboard. A tela cheia fica em
 * `/dashboard/startup/conexoes`; aqui é só o panorama.
 */
export default function PainelConexoesResumo({ conexoes }: { conexoes: Conexao[] | null }) {
  const contar = (status: StatusConexao) => (conexoes ?? []).filter((c) => c.status === status).length

  return (
    <section
      aria-labelledby="titulo-conexoes-resumo"
      className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2 id="titulo-conexoes-resumo" className="text-lg font-semibold">
        Conexões em andamento
      </h2>

      {conexoes === null ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-brand-100" />
          ))}
        </div>
      ) : conexoes.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          Você ainda não demonstrou interesse em nenhuma oportunidade.
        </p>
      ) : (
        <>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <Numero rotulo="Aguardando resposta" valor={contar('pendente')} />
            <Numero rotulo="Match" valor={contar('aceito')} destaque />
            <Numero rotulo="Não seguiu" valor={contar('recusado')} />
          </dl>

          <div className="mt-5">
            <Botao to="/dashboard/startup/conexoes">Ver todas as conexões</Botao>
          </div>
        </>
      )}
    </section>
  )
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div
      className={[
        'rounded-xl border p-4 text-center',
        destaque && valor > 0 ? 'border-accent-300 bg-accent-100' : 'border-brand-100 bg-surface-2',
      ].join(' ')}
    >
      <dd className="font-display text-2xl font-bold text-ink-900">{valor}</dd>
      <dt className="mt-0.5 text-xs text-ink-500">{rotulo}</dt>
    </div>
  )
}

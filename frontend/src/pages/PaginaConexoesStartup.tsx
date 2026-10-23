import { CheckIcon } from '@/components/icons.tsx'
import Botao from '@/components/Botao.tsx'
import {
  listarConexoes,
  type Conexao,
  type OrigemDosDados,
  type StatusConexao,
} from '@/lib/oportunidades.ts'
import { useEffect, useState } from 'react'

type Carga =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; origem: OrigemDosDados }

const ROTULO: Record<StatusConexao, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando resposta', classe: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' },
  aceito: { texto: 'Match', classe: 'bg-accent-600 text-white' },
  recusado: { texto: 'Não seguiu', classe: 'text-ink-500 ring-1 ring-brand-100' },
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/**
 * "Conexões": o que a startup já se inscreveu e o que a empresa respondeu.
 *
 * Separada das Oportunidades de propósito. Lá é descoberta, aqui é
 * acompanhamento: misturar as duas faria as demandas já respondidas se
 * perderem no meio das novas.
 */
export default function PaginaConexoesStartup() {
  const [carga, setCarga] = useState<Carga>({ status: 'carregando' })
  const [conexoes, setConexoes] = useState<Conexao[]>([])

  useEffect(() => {
    let ativo = true
    listarConexoes()
      .then(({ conexoes, origem }) => {
        if (!ativo) return
        setConexoes(conexoes)
        setCarga({ status: 'ok', origem })
      })
      .catch(() => {
        if (ativo) setCarga({ status: 'erro' })
      })
    return () => {
      ativo = false
    }
  }, [])

  const contar = (status: StatusConexao) => conexoes.filter((c) => c.status === status).length

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Conexões
          </h1>
          {carga.status === 'ok' && carga.origem === 'simulado' && (
            <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
              Dados de exemplo
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-500">
          As oportunidades em que você demonstrou interesse e o que as empresas responderam.
        </p>
      </header>

      {carga.status === 'carregando' && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-brand-100" />
          ))}
        </div>
      )}

      {carga.status === 'erro' && (
        <p className="rounded-card border border-dashed border-brand-200 px-6 py-12 text-center text-sm text-ink-500">
          Não foi possível carregar suas conexões. Tente novamente em instantes.
        </p>
      )}

      {carga.status === 'ok' && conexoes.length === 0 && (
        <div className="rounded-card border border-dashed border-brand-200 bg-surface px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-ink-900">Você ainda não se conectou com nenhuma empresa</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Quando você demonstrar interesse em uma oportunidade, ela aparece aqui com a resposta da empresa.
          </p>
          <div className="mt-6 flex justify-center">
            <Botao to="/dashboard/startup/oportunidades">Ver oportunidades</Botao>
          </div>
        </div>
      )}

      {carga.status === 'ok' && conexoes.length > 0 && (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Contador rotulo="Aguardando resposta" valor={contar('pendente')} />
            <Contador rotulo="Match" valor={contar('aceito')} destaque />
            <Contador rotulo="Não seguiu" valor={contar('recusado')} />
          </dl>

          <ul className="flex flex-col gap-3">
            {conexoes.map((conexao) => (
              <LinhaConexao key={conexao.id} conexao={conexao} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Contador({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div
      className={[
        'rounded-card border p-5 text-center',
        destaque && valor > 0 ? 'border-accent-300 bg-accent-100' : 'border-brand-100 bg-surface',
      ].join(' ')}
    >
      <dd className="font-display text-3xl font-bold text-ink-900">{valor}</dd>
      <dt className="mt-1 text-sm text-ink-500">{rotulo}</dt>
    </div>
  )
}

function LinhaConexao({ conexao }: { conexao: Conexao }) {
  const rotulo = ROTULO[conexao.status]
  const match = conexao.status === 'aceito'

  return (
    <li
      className={[
        'rounded-card border bg-surface p-5',
        match ? 'border-accent-300' : 'border-brand-100',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900">{conexao.oportunidade.empresa}</h2>
          <p className="mt-1 text-sm text-ink-700">{conexao.oportunidade.demanda}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${rotulo.classe}`}>
          {match && <CheckIcon className="mr-1 inline size-3.5 align-[-2px]" />}
          {rotulo.texto}
        </span>
      </div>

      <p className="mt-3 text-xs text-ink-500">
        Interesse enviado em {formatarData(conexao.created_at)}
        {conexao.respondido_em && ` · Respondido em ${formatarData(conexao.respondido_em)}`}
      </p>

      {match && (
        <p className="mt-3 rounded-xl bg-accent-100 px-4 py-3 text-sm text-ink-700">
          <span className="font-semibold text-ink-900">A empresa aceitou seu interesse.</span> O próximo
          passo é combinar uma conversa.
        </p>
      )}
    </li>
  )
}

import CartaoOportunidade, {
  CartaoOportunidadeCarregando,
  type EstadoDoCard,
} from '@/components/dashboard-startup/CartaoOportunidade.tsx'
import {
  ignorarOportunidade,
  listarOportunidades,
  manifestarInteresse,
  type Oportunidade,
  type OrigemDosDados,
} from '@/lib/oportunidades.ts'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Carga =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; origem: OrigemDosDados }

/** Seção "Oportunidades recomendadas". */
/**
 * Painel de oportunidades recomendadas.
 *
 * Aparece em dois lugares: na home do dashboard, onde divide espaço com
 * outros painéis e precisa do próprio título, e na página de Oportunidades,
 * onde o título da página já diz a mesma coisa. Daí `comCabecalho`.
 */
export default function PainelOportunidades({
  comCabecalho = true,
  limite,
}: {
  comCabecalho?: boolean
  /** Quantos cards mostrar. Sem limite, mostra todos. */
  limite?: number
}) {
  const [carga, setCarga] = useState<Carga>({ status: 'carregando' })
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [estados, setEstados] = useState<Record<string, EstadoDoCard>>({})
  const [aviso, setAviso] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const carregar = useCallback(() => {
    setCarga({ status: 'carregando' })
    listarOportunidades()
      .then(({ oportunidades, origem }) => {
        setOportunidades(oportunidades)
        setEstados({})
        setCarga({ status: 'ok', origem })
      })
      .catch(() => setCarga({ status: 'erro' }))
  }, [])

  useEffect(() => {
    let cancelado = false
    listarOportunidades()
      .then(({ oportunidades, origem }) => {
        if (cancelado) return
        setOportunidades(oportunidades)
        setEstados({})
        setCarga({ status: 'ok', origem })
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: 'erro' })
      })
    return () => {
      cancelado = true
    }
  }, [])

  function definirEstado(id: string, estado: EstadoDoCard | null) {
    setEstados((atual) => {
      const { [id]: _removido, ...resto } = atual
      return estado ? { ...resto, [id]: estado } : resto
    })
  }

  async function handleInteresse(o: Oportunidade) {
    // Bloqueia cliques repetidos enquanto a ação está em andamento.
    if (estados[o.id] && estados[o.id] !== 'ocioso') return
    definirEstado(o.id, 'interessando')
    setAviso(null)
    try {
      await manifestarInteresse(o.id)
      definirEstado(o.id, 'interessado')
      setAviso({ tipo: 'sucesso', texto: `Interesse em ${o.empresa} enviado. Acompanhe em Conexões.` })
    } catch {
      definirEstado(o.id, null)
      setAviso({ tipo: 'erro', texto: `Não foi possível registrar o interesse em ${o.empresa}. Tente novamente.` })
    }
  }

  async function handleIgnorar(o: Oportunidade) {
    if (estados[o.id] && estados[o.id] !== 'ocioso') return
    definirEstado(o.id, 'ignorando')
    setAviso(null)
    try {
      await ignorarOportunidade(o.id)
      setOportunidades((atual) => atual.filter((item) => item.id !== o.id))
      definirEstado(o.id, null)
    } catch {
      definirEstado(o.id, null)
      setAviso({ tipo: 'erro', texto: `Não foi possível ignorar a oportunidade de ${o.empresa}. Tente novamente.` })
    }
  }

  const simulado = carga.status === 'ok' && carga.origem === 'simulado'
  // No dashboard o painel é resumo: mostra algumas e manda o resto para a
  // página de Oportunidades, para a home não virar uma rolagem longa.
  const visiveis = limite ? oportunidades.slice(0, limite) : oportunidades
  const sobrando = oportunidades.length - visiveis.length

  return (
    <section aria-labelledby={comCabecalho ? 'titulo-oportunidades' : undefined}>
      {comCabecalho ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="titulo-oportunidades" className="text-lg font-semibold">
              Oportunidades recomendadas
            </h2>
            {simulado && <SeloExemplo />}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Empresas com demandas compatíveis com as tecnologias, serviços e especialidades do seu perfil.
          </p>
        </>
      ) : (
        simulado && (
          <div className="mb-4">
            <SeloExemplo />
          </div>
        )
      )}

      {aviso && (
        <p
          role={aviso.tipo === 'erro' ? 'alert' : 'status'}
          className={[
            'mt-4 rounded-xl px-4 py-3 text-sm font-medium',
            aviso.tipo === 'erro' ? 'bg-accent-100 text-accent-700' : 'bg-brand-50 text-brand-700',
          ].join(' ')}
        >
          {aviso.texto}
        </p>
      )}

      <div className="mt-4">
        {carga.status === 'carregando' && (
          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Carregando oportunidades" aria-busy="true">
            <CartaoOportunidadeCarregando />
            <CartaoOportunidadeCarregando />
          </ul>
        )}

        {carga.status === 'erro' && (
          <div role="alert" className="rounded-card border border-accent-300 bg-accent-100 p-6 text-center">
            <p className="text-sm font-semibold text-ink-900">Não foi possível carregar as oportunidades.</p>
            <button
              type="button"
              onClick={carregar}
              className="mt-3 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {carga.status === 'ok' && oportunidades.length === 0 && (
          <div className="rounded-card border border-dashed border-brand-200 bg-surface p-8 text-center">
            <p className="text-sm font-semibold text-ink-900">Nenhuma oportunidade no momento</p>
            <p className="mt-1 text-sm text-ink-500">
              Complete seu perfil e volte em breve: novas demandas compatíveis aparecem aqui.
            </p>
          </div>
        )}

        {carga.status === 'ok' && oportunidades.length > 0 && (
          <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {visiveis.map((o) => (
              <CartaoOportunidade
                key={o.id}
                oportunidade={o}
                estado={estados[o.id] ?? 'ocioso'}
                onInteresse={() => handleInteresse(o)}
                onIgnorar={() => handleIgnorar(o)}
              />
            ))}
          </ul>

          {sobrando > 0 && (
            <div className="mt-4">
              <Link
                to="/dashboard/startup/oportunidades"
                className="text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
              >
                Ver mais {sobrando} {sobrando === 1 ? 'oportunidade' : 'oportunidades'}
              </Link>
            </div>
          )}
          </>
        )}
      </div>
    </section>
  )
}

function SeloExemplo() {
  return (
    <span
      title="O backend ainda não tem endpoints de oportunidades e compatibilidade. Estes cards são exemplos."
      className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
    >
      Dados de exemplo
    </span>
  )
}

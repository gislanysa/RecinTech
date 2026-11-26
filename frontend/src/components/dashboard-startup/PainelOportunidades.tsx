import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import CartaoOportunidade, {
  CartaoOportunidadeCarregando,
  type EstadoDoCard,
} from '@/components/dashboard-startup/CartaoOportunidade.tsx'
import { CloseIcon } from '@/components/icons.tsx'
import type { Startup } from '@/lib/api.ts'
import { ehUuidValido } from '@/lib/catalogos.ts'
import {
  candidatarADemanda,
  desistirCandidaturaDemanda,
  FAIXAS_ORCAMENTO,
  filtrarPorFaixaOrcamento,
  type FaixaOrcamento,
} from '@/lib/demandas.ts'
import { formatarMoeda } from '@/lib/formatadores.ts'
import {
  ignorarOportunidade,
  listarOportunidades,
  manifestarInteresse,
  type Oportunidade,
  type OrigemDosDados,
} from '@/lib/oportunidades.ts'
import type { Tags } from '@/lib/perfil.ts'
import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

type Carga =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'ok'; origem: OrigemDosDados }

/**
 * Painel de oportunidades recomendadas com base nas demandas reais cadastradas pelas empresas.
 *
 * Aparece no dashboard da startup (como resumo) e na página de Oportunidades.
 */
export default function PainelOportunidades({
  comCabecalho = true,
  limite,
  startupId,
  tags,
}: {
  comCabecalho?: boolean
  /** Quantos cards mostrar. Sem limite, mostra todos. */
  limite?: number
  startupId?: string
  tags?: Tags | null
}) {
  const contexto = useOutletContext<ContextoSessao | undefined>()
  const startupAtualId = startupId ?? (contexto?.conta as Startup | undefined)?.id
  const [carga, setCarga] = useState<Carga>({ status: 'carregando' })
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [estados, setEstados] = useState<Record<string, EstadoDoCard>>({})
  const [aviso, setAviso] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Estado do Modal de Candidatura e Negociação de Valor
  const [oportunidadeModal, setOportunidadeModal] = useState<Oportunidade | null>(null)
  const [tipoProposta, setTipoProposta] = useState<'aceitou' | 'contraproposta'>('aceitou')
  const [valorContraproposta, setValorContraproposta] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [enviandoCandidatura, setEnviandoCandidatura] = useState(false)
  const [faixaFiltro, setFaixaFiltro] = useState<FaixaOrcamento>('todas')

  const carregar = useCallback(() => {
    setCarga({ status: 'carregando' })
    listarOportunidades(startupAtualId, tags)
      .then(({ oportunidades, origem }) => {
        setOportunidades(oportunidades)
        setEstados({})
        setCarga({ status: 'ok', origem })
      })
      .catch(() => setCarga({ status: 'erro' }))
  }, [startupAtualId, tags])

  useEffect(() => {
    let cancelado = false
    listarOportunidades(startupAtualId, tags)
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
  }, [startupAtualId, tags])

  function definirEstado(id: string, estado: EstadoDoCard | null) {
    setEstados((atual) => {
      const { [id]: _removido, ...resto } = atual
      return estado ? { ...resto, [id]: estado } : resto
    })
  }

  function handleIniciarCandidatura(o: Oportunidade) {
    if (estados[o.id] && estados[o.id] !== 'ocioso') return
    setOportunidadeModal(o)
    setTipoProposta('aceitou')
    setValorContraproposta(o.orcamento ? String(o.orcamento) : '')
    setJustificativa('')
  }

  async function handleConfirmarCandidatura() {
    if (!oportunidadeModal) return
    const o = oportunidadeModal
    setEnviandoCandidatura(true)
    definirEstado(o.id, 'interessando')
    setAviso(null)

    const valorFinal =
      tipoProposta === 'contraproposta' && valorContraproposta.trim()
        ? Number(valorContraproposta)
        : o.orcamento

    try {
      if (startupAtualId && ehUuidValido(o.id)) {
        await candidatarADemanda(startupAtualId, {
          demand: o.id,
          tipo_proposta: tipoProposta,
          valor_proposto: valorFinal,
          justificativa: tipoProposta === 'contraproposta' ? justificativa.trim() : undefined,
        })
      } else {
        await manifestarInteresse(o.id)
      }
      definirEstado(o.id, 'interessado')
      const msgValor =
        tipoProposta === 'contraproposta' && valorFinal
          ? `com contraproposta de ${formatarMoeda(valorFinal)}`
          : o.orcamento
            ? `aceitando o orçamento de ${formatarMoeda(o.orcamento)}`
            : ''
      setAviso({
        tipo: 'sucesso',
        texto: `Candidatura à demanda de ${o.empresa} enviada com sucesso ${msgValor}! Acompanhe em Conexões.`,
      })
      setOportunidadeModal(null)
    } catch {
      definirEstado(o.id, null)
      setAviso({
        tipo: 'erro',
        texto: `Não foi possível registrar a candidatura na demanda de ${o.empresa}. Tente novamente.`,
      })
    } finally {
      setEnviandoCandidatura(false)
    }
  }

  async function handleDesistir(o: Oportunidade) {
    if (estados[o.id] && estados[o.id] !== 'interessado') return
    definirEstado(o.id, 'desistindo')
    setAviso(null)
    try {
      if (startupAtualId && ehUuidValido(o.id)) {
        await desistirCandidaturaDemanda(startupAtualId, o.id)
      }
      definirEstado(o.id, 'ocioso')
      setAviso({ tipo: 'sucesso', texto: `Candidatura à demanda de ${o.empresa} cancelada com sucesso.` })
    } catch {
      definirEstado(o.id, 'interessado')
      setAviso({ tipo: 'erro', texto: `Não foi possível cancelar a candidatura na demanda de ${o.empresa}. Tente novamente.` })
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

  // No dashboard o painel é resumo: mostra algumas e manda o resto para a
  // página de Oportunidades, para a home não virar uma rolagem longa.
  const filtradas = filtrarPorFaixaOrcamento(oportunidades, faixaFiltro)
  const visiveis = limite ? filtradas.slice(0, limite) : filtradas
  const sobrando = filtradas.length - visiveis.length

  return (
    <section aria-labelledby={comCabecalho ? 'titulo-oportunidades' : undefined}>
      {comCabecalho && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="titulo-oportunidades" className="text-lg font-semibold">
              Oportunidades recomendadas
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Empresas com demandas compatíveis com as tecnologias, serviços e especialidades do seu perfil.
          </p>
        </>
      )}

      {/* Barra de Filtro por Faixa de Valor */}
      {carga.status === 'ok' && oportunidades.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-2.5">
          <span className="text-xs font-semibold text-ink-700">Faixa de valor da empresa:</span>
          {FAIXAS_ORCAMENTO.map((faixa) => {
            const ativo = faixaFiltro === faixa.id
            return (
              <button
                key={faixa.id}
                type="button"
                onClick={() => setFaixaFiltro(faixa.id)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  ativo
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'border border-gray-200 bg-surface text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                ].join(' ')}
                aria-pressed={ativo}
              >
                {faixa.rotulo}
              </button>
            )
          })}
        </div>
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
          <div role="alert" className="rounded-card bg-accent-50 p-6 text-center shadow-sm">
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
          <div className="rounded-card bg-surface p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink-900">Nenhuma oportunidade no momento</p>
            <p className="mt-1 text-sm text-ink-500">
              Complete seu perfil e volte em breve: novas demandas compatíveis aparecem aqui.
            </p>
          </div>
        )}

        {carga.status === 'ok' && oportunidades.length > 0 && filtradas.length === 0 && (
          <div className="rounded-card bg-surface p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-ink-900">
              Nenhuma oportunidade encontrada nesta faixa de valor.
            </p>
            <button
              type="button"
              onClick={() => setFaixaFiltro('todas')}
              className="mt-3 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Ver todas as faixas
            </button>
          </div>
        )}

        {carga.status === 'ok' && filtradas.length > 0 && (
          <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {visiveis.map((o) => (
              <CartaoOportunidade
                key={o.id}
                oportunidade={o}
                estado={estados[o.id] ?? 'ocioso'}
                onInteresse={() => handleIniciarCandidatura(o)}
                onIgnorar={() => handleIgnorar(o)}
                onDesistir={() => handleDesistir(o)}
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

      {/* Modal de Candidatura e Proposta de Valor */}
      {oportunidadeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-proposta-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={() => setOportunidadeModal(null)}
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
            <div className="flex items-start justify-between border-b border-brand-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Candidatura & Proposta de Valor
                </span>
                <h3 id="modal-proposta-titulo" className="mt-1 font-display text-lg font-bold text-ink-900 sm:text-xl">
                  {oportunidadeModal.empresa}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOportunidadeModal(null)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-50"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="py-5 text-sm text-ink-700">
              <p className="font-medium text-ink-900">{oportunidadeModal.demanda}</p>

              {oportunidadeModal.orcamento && oportunidadeModal.orcamento > 0 ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <span className="text-xs font-medium text-emerald-800">
                    A empresa definiu um orçamento para esta demanda:
                  </span>
                  <p className="mt-0.5 text-xl font-bold text-emerald-900">
                    {formatarMoeda(oportunidadeModal.orcamento)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-500">
                  Esta empresa optou por receber propostas abertas de valor.
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Sua Proposta Financeira:
                </span>

                <label className="flex items-start gap-3 rounded-xl border border-brand-200 p-3.5 cursor-pointer hover:bg-brand-50/40">
                  <input
                    type="radio"
                    name="tipoProposta"
                    checked={tipoProposta === 'aceitou'}
                    onChange={() => setTipoProposta('aceitou')}
                    className="mt-1 size-4 text-brand-600 focus:ring-accent-500"
                  />
                  <div>
                    <span className="font-semibold text-ink-900">
                      {oportunidadeModal.orcamento
                        ? `Aceitar o valor oferecido (${formatarMoeda(oportunidadeModal.orcamento)})`
                        : 'Aceitar valor a combinar'}
                    </span>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Sua startup concorda em desenvolver a solução pelo valor estimado pela empresa.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-brand-200 p-3.5 cursor-pointer hover:bg-brand-50/40">
                  <input
                    type="radio"
                    name="tipoProposta"
                    checked={tipoProposta === 'contraproposta'}
                    onChange={() => setTipoProposta('contraproposta')}
                    className="mt-1 size-4 text-brand-600 focus:ring-accent-500"
                  />
                  <div className="w-full">
                    <span className="font-semibold text-ink-900">
                      Fazer uma contraproposta de valor
                    </span>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Proponha um valor mais alinhado ao escopo técnico ou complexidade da entrega.
                    </p>

                    {tipoProposta === 'contraproposta' && (
                      <div className="mt-3 flex flex-col gap-2">
                        <label htmlFor="contraproposta-valor" className="text-xs font-medium text-ink-700">
                          Novo valor proposto (R$):
                        </label>
                        <input
                          id="contraproposta-valor"
                          type="number"
                          min="0"
                          step="500"
                          value={valorContraproposta}
                          onChange={(e) => setValorContraproposta(e.target.value)}
                          placeholder="Ex: 38000"
                          className="w-full rounded-lg border border-brand-200 bg-surface px-3 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
                        />

                        <label htmlFor="contraproposta-motivo" className="text-xs font-medium text-ink-700 mt-1">
                          Justificativa da contraproposta (opcional):
                        </label>
                        <textarea
                          id="contraproposta-motivo"
                          rows={2}
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          placeholder="Ex.: Inclui suporte estendido e infraestrutura cloud de alta disponibilidade."
                          className="w-full rounded-lg border border-brand-200 bg-surface px-3 py-2 text-xs text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-brand-100 pt-4">
              <button
                type="button"
                disabled={enviandoCandidatura}
                onClick={() => setOportunidadeModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-ink-600 hover:bg-brand-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoCandidatura}
                onClick={handleConfirmarCandidatura}
                className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700 disabled:opacity-50"
              >
                {enviandoCandidatura ? 'Enviando…' : 'Confirmar Candidatura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

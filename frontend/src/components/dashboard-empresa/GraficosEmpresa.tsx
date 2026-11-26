import { useEffect, useMemo, useState } from 'react'
import type { Demanda, CandidaturaDemanda } from '@/lib/demandas.ts'
import { listarCandidaturasDemanda } from '@/lib/demandas.ts'

interface GraficosEmpresaProps {
  demandas: Demanda[]
  candidaturasIniciais?: CandidaturaDemanda[]
}

/**
 * Gráfico Visual do Dashboard da Empresa
 */
export default function GraficosEmpresa({
  demandas,
  candidaturasIniciais,
}: GraficosEmpresaProps) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaDemanda[]>(
    candidaturasIniciais ?? [],
  )
  const [carregandoCandidaturas, setCarregandoCandidaturas] = useState(
    !candidaturasIniciais && demandas.length > 0,
  )

  // Carrega as candidaturas consolidadas de todas as demandas da empresa
  useEffect(() => {
    if (candidaturasIniciais || demandas.length === 0) return

    let ativo = true

    async function buscarTodas() {
      try {
        const promessas = demandas.map((d) =>
          listarCandidaturasDemanda(d.id).catch(() => [] as CandidaturaDemanda[]),
        )
        const resultados = await Promise.all(promessas)
        if (ativo) {
          const unificadas = resultados.flat()
          setCandidaturas(unificadas)
        }
      } catch {
        if (ativo) setCandidaturas([])
      } finally {
        if (ativo) setCarregandoCandidaturas(false)
      }
    }

    void buscarTodas()

    // Ouve alterações no storage para atualizar em tempo real
    function aoAlterarStorage(e: StorageEvent) {
      if (e.key === 'recintech:propostas_candidaturas') {
        void buscarTodas()
      }
    }
    window.addEventListener('storage', aoAlterarStorage)

    return () => {
      ativo = false
      window.removeEventListener('storage', aoAlterarStorage)
    }
  }, [demandas, candidaturasIniciais])

  // Métricas do Gráfico: Status das Candidaturas
  const metricasCandidaturas = useMemo(() => {
    const total = candidaturas.length
    const pendentes = candidaturas.filter((c) => c.status === 'pending').length
    const aceitas = candidaturas.filter((c) => c.status === 'accepted').length
    const recusadas = candidaturas.filter((c) => c.status === 'declined').length
    const contrapropostas = candidaturas.filter(
      (c) => c.tipo_proposta === 'contraproposta' || (c.valor_proposto && c.valor_proposto > 0),
    ).length

    const pctAceitas = total > 0 ? Math.round((aceitas / total) * 100) : 0
    const pctPendentes = total > 0 ? Math.round((pendentes / total) * 100) : 0
    const pctRecusadas = total > 0 ? Math.round((recusadas / total) * 100) : 0

    return {
      total,
      pendentes,
      aceitas,
      recusadas,
      contrapropostas,
      pctAceitas,
      pctPendentes,
      pctRecusadas,
    }
  }, [candidaturas])

  // Parâmetros para o Donut SVG (Raio = 38, Circunferência ≈ 238.76)
  const raio = 38
  const circunferencia = 2 * Math.PI * raio
  const dashAceitas = (metricasCandidaturas.pctAceitas / 100) * circunferencia
  const dashPendentes = (metricasCandidaturas.pctPendentes / 100) * circunferencia
  const dashRecusadas = (metricasCandidaturas.pctRecusadas / 100) * circunferencia

  const offsetAceitas = 0
  const offsetPendentes = -dashAceitas
  const offsetRecusadas = -(dashAceitas + dashPendentes)

  return (
    <section
      id="secao-indicadores-empresa"
      aria-label="Indicadores de candidaturas recebidas da empresa"
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-bold text-ink-900 sm:text-xl">
          Status das Candidaturas Recebidas
        </h2>
        <p className="text-xs text-ink-500">
          Acompanhamento das propostas enviadas por startups para as oportunidades publicadas
        </p>
      </div>

      {/* Card do Gráfico de Status de Candidaturas */}
      <div
        id="card-grafico-candidaturas"
        className="flex flex-col justify-between rounded-card bg-surface p-5 shadow-sm sm:p-6"
      >
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">
              Distribuição por Status
            </h3>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-700">
              {metricasCandidaturas.total}{' '}
              {metricasCandidaturas.total === 1 ? 'candidatura' : 'candidaturas'}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Proporção de propostas em análise, conexões aprovadas e recusas
          </p>

          {carregandoCandidaturas ? (
            <div className="my-8 flex h-48 animate-pulse items-center justify-center rounded-xl bg-brand-50">
              <span className="text-xs font-medium text-ink-500">
                Carregando candidaturas...
              </span>
            </div>
          ) : metricasCandidaturas.total === 0 ? (
            <div className="my-6 flex flex-col items-center justify-center rounded-xl bg-surface-2/40 p-6 text-center">
              <p className="text-sm font-semibold text-ink-900">
                Nenhuma candidatura recebida ainda
              </p>
              <p className="mt-1 max-w-xs text-xs text-ink-500">
                Quando startups se candidatarem às suas demandas abertas, os indicadores de conversão aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center sm:flex-row sm:items-center sm:justify-around gap-8">
              {/* Donut Chart SVG */}
              <div className="relative flex items-center justify-center">
                <svg
                  className="size-40 -rotate-90 transform"
                  viewBox="0 0 100 100"
                  aria-label="Gráfico em donut do status de candidaturas"
                >
                  {/* Círculo de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r={raio}
                    className="stroke-brand-50"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Aceitas (Marca/Escuro) */}
                  {metricasCandidaturas.aceitas > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={raio}
                      className="stroke-brand-600 transition-all duration-500"
                      strokeWidth="12"
                      strokeDasharray={`${dashAceitas} ${circunferencia}`}
                      strokeDashoffset={offsetAceitas}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  )}
                  {/* Pendentes (Azul claro) */}
                  {metricasCandidaturas.pendentes > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={raio}
                      className="stroke-brand-400 transition-all duration-500"
                      strokeWidth="12"
                      strokeDasharray={`${dashPendentes} ${circunferencia}`}
                      strokeDashoffset={offsetPendentes}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  )}
                  {/* Recusadas (Tinta / Cinza) */}
                  {metricasCandidaturas.recusadas > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={raio}
                      className="stroke-ink-400 transition-all duration-500"
                      strokeWidth="12"
                      strokeDasharray={`${dashRecusadas} ${circunferencia}`}
                      strokeDashoffset={offsetRecusadas}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-display text-2xl font-bold text-ink-900">
                    {metricasCandidaturas.total}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-500">
                    Total
                  </span>
                </div>
              </div>

              {/* Legendas e barras por status */}
              <div className="flex w-full max-w-md flex-col gap-3.5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-ink-700">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <span className="size-2.5 rounded-full bg-brand-600" />
                      Aceitas (Match)
                    </span>
                    <span>
                      {metricasCandidaturas.pctAceitas}% ({metricasCandidaturas.aceitas})
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-brand-50">
                    <div
                      className="h-2.5 rounded-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${metricasCandidaturas.pctAceitas}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-ink-700">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <span className="size-2.5 rounded-full bg-brand-400" />
                      Em análise (Pendentes)
                    </span>
                    <span>
                      {metricasCandidaturas.pctPendentes}% ({metricasCandidaturas.pendentes})
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-brand-50">
                    <div
                      className="h-2.5 rounded-full bg-brand-400 transition-all duration-500"
                      style={{ width: `${metricasCandidaturas.pctPendentes}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-ink-700">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900">
                      <span className="size-2.5 rounded-full bg-ink-400" />
                      Não seguiu (Recusadas)
                    </span>
                    <span>
                      {metricasCandidaturas.pctRecusadas}% ({metricasCandidaturas.recusadas})
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-brand-50">
                    <div
                      className="h-2.5 rounded-full bg-ink-400 transition-all duration-500"
                      style={{ width: `${metricasCandidaturas.pctRecusadas}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {metricasCandidaturas.contrapropostas > 0 && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-accent-100/60 p-3 text-xs text-ink-700">
            <span className="font-semibold text-accent-700">
              {metricasCandidaturas.contrapropostas}{' '}
              {metricasCandidaturas.contrapropostas === 1
                ? 'candidatura com contraproposta financeira'
                : 'candidaturas com contraproposta financeira'}
            </span>
            <span className="text-[11px] text-ink-500">Negociação ativa</span>
          </div>
        )}
      </div>
    </section>
  )
}

import Botao from '@/components/Botao.tsx'
import type { Demanda, StatusDemanda } from '@/lib/demandas.ts'

type PainelDemandasProps = {
  demandas: Demanda[]
  carregando: boolean
  erro: string | null
  demandaAtivaId?: string
  contagemRecomendacoesPorDemanda: Record<string, number>
  onNovaDemanda: () => void
  onEditarDemanda?: (demanda: Demanda) => void
  onSelecionarDemanda: (id: string) => void
  onTentarNovamente?: () => void
}

function badgeStatus(status: StatusDemanda) {
  switch (status) {
    case 'aberta':
      return {
        texto: 'Aberta',
        classe: 'text-emerald-700',
      }
    case 'em_andamento':
      return {
        texto: 'Em andamento',
        classe: 'text-blue-700',
      }
    case 'encerrada':
      return {
        texto: 'Encerrada',
        classe: 'text-ink-500',
      }
  }
}

export default function PainelDemandas({
  demandas,
  carregando,
  erro,
  demandaAtivaId,
  contagemRecomendacoesPorDemanda,
  onNovaDemanda,
  onEditarDemanda,
  onSelecionarDemanda,
  onTentarNovamente,
}: PainelDemandasProps) {
  return (
    <section
      aria-labelledby="titulo-demandas"
      className="flex flex-col gap-5 rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6"
    >
      {/* Cabeçalho interno do painel com título e botão de adicionar nova demanda */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="titulo-demandas" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
              Minhas demandas
            </h2>
            {!carregando && (
              <span className="text-base font-semibold text-ink-500 sm:text-lg">
                ({demandas.length})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500 sm:text-sm">
            Gerencie as necessidades tecnológicas da sua empresa e acompanhe as recomendações.
          </p>
        </div>

        <Botao onClick={onNovaDemanda} id="btn-adicionar-demanda">
          <span className="text-base font-bold">+</span>
          Adicionar nova demanda
        </Botao>
      </div>

      {/* Estado de Carregamento */}
      {carregando && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-brand-100 bg-surface-2/60 p-5 shadow-sm"
            >
              <div className="h-4 w-24 rounded bg-brand-100" />
              <div className="mt-3 h-5 w-3/4 rounded bg-brand-100" />
              <div className="mt-2 h-4 w-full rounded bg-brand-50" />
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-brand-100" />
                <div className="h-6 w-20 rounded-full bg-brand-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado de Erro */}
      {!carregando && erro && (
        <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{erro}</p>
          {onTentarNovamente && (
            <button
              type="button"
              onClick={onTentarNovamente}
              className="mt-3 text-xs font-semibold text-brand-700 hover:underline"
            >
              Tentar carregar novamente
            </button>
          )}
        </div>
      )}

      {/* Estado Vazio */}
      {!carregando && !erro && demandas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-200 bg-surface-2/40 px-6 py-12 text-center">
          <h3 className="font-display text-base font-semibold text-ink-900">
            Você ainda não possui demandas cadastradas
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-ink-500 sm:text-sm">
            Cadastre as necessidades tecnológicas da sua empresa para que nosso sistema recomende as
            startups mais compatíveis.
          </p>
        </div>
      )}

      {/* Lista de Demandas */}
      {!carregando && !erro && demandas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {demandas.map((demanda) => {
            const statusInfo = badgeStatus(demanda.status)
            const ativa = demandaAtivaId === demanda.id
            const qtdRecomendadas = contagemRecomendacoesPorDemanda[demanda.id] ?? 0
            const temRecomendacoes = qtdRecomendadas > 0

            return (
              <div
                key={demanda.id}
                onClick={() => {
                  if (temRecomendacoes) onSelecionarDemanda(demanda.id)
                }}
                role={temRecomendacoes ? 'button' : undefined}
                tabIndex={temRecomendacoes ? 0 : undefined}
                onKeyDown={(e) => {
                  if (temRecomendacoes && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelecionarDemanda(demanda.id)
                  }
                }}
                className={[
                  'group flex flex-col justify-between rounded-xl border p-4 sm:p-5 text-left transition-all',
                  temRecomendacoes ? 'cursor-pointer' : 'cursor-default',
                  ativa
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-sm'
                    : 'border-brand-100 bg-surface-2/40 hover:border-brand-300 hover:bg-surface hover:shadow-sm',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-brand-700">
                      {demanda.segmento}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${statusInfo.classe}`}>
                        {statusInfo.texto}
                      </span>
                      {onEditarDemanda && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditarDemanda(demanda)
                          }}
                          className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-ink-900 ring-1 ring-brand-200 shadow-[0_0_8px_rgb(0_0_0/0.05)] transition-all duration-300 hover:bg-brand-600 hover:text-white hover:ring-brand-600 active:bg-brand-600 active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-3 font-display text-base font-bold text-ink-900 group-hover:text-brand-700">
                    {demanda.titulo}
                  </h3>

                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-500 sm:text-sm">
                    {demanda.descricao}
                  </p>

                  {/* Tags de tecnologias e serviços */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {demanda.servicos.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-brand-100"
                      >
                        {s}
                      </span>
                    ))}
                    {demanda.tecnologias.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-accent-50 px-2.5 py-0.5 text-[11px] font-medium text-accent-800 ring-1 ring-accent-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-brand-100 pt-3 text-xs">
                  <span className="font-medium text-ink-700">
                    {temRecomendacoes ? (
                      <>
                        <strong className="text-brand-700">{qtdRecomendadas}</strong>{' '}
                        {qtdRecomendadas === 1 ? 'startup recomendada' : 'startups recomendadas'}
                      </>
                    ) : (
                      <span className="text-ink-500 font-normal">Nenhuma recomendação no momento</span>
                    )}
                  </span>

                  {temRecomendacoes && (
                    <span className="font-semibold text-brand-600 group-hover:underline">
                      {ativa ? 'Filtrando recomendações ✓' : 'Ver recomendações →'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

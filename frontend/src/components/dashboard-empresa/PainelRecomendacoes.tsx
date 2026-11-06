import type { Demanda, Recomendacao } from '@/lib/demandas.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'

type PainelRecomendacoesProps = {
  recomendacoes: Recomendacao[]
  demandas: Demanda[]
  demandaAtivaId?: string
  carregando: boolean
  onSelecionarDemandaFiltro: (id?: string) => void
  onVerPerfil: (startup: StartupCatalogo, demandaId?: string) => void
}

export default function PainelRecomendacoes({
  recomendacoes,
  demandas,
  demandaAtivaId,
  carregando,
  onSelecionarDemandaFiltro,
  onVerPerfil,
}: PainelRecomendacoesProps) {
  const demandaSelecionadaObj = demandas.find((d) => d.id === demandaAtivaId)

  return (
    <section aria-labelledby="titulo-recomendacoes" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="titulo-recomendacoes" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
              Startups recomendadas
            </h2>
            {!carregando && (
              <span className="text-base font-semibold text-ink-500 sm:text-lg">
                ({recomendacoes.length})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500 sm:text-sm">
            Startups compatíveis com as necessidades e tecnologias que a sua empresa procura.
          </p>
        </div>

        {/* Seletor de demanda para filtrar recomendações */}
        {demandas.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-demanda-rec" className="text-xs font-medium text-ink-500">
              Filtrar por demanda:
            </label>
            <select
              id="filtro-demanda-rec"
              value={demandaAtivaId ?? ''}
              onChange={(e) => onSelecionarDemandaFiltro(e.target.value || undefined)}
              className="rounded-xl border border-brand-200 bg-surface px-3 py-1.5 text-xs text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">Todas as demandas ({demandas.length})</option>
              {demandas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titulo}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Indicador de filtro ativo */}
      {demandaSelecionadaObj && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50/70 px-4 py-2 text-xs text-brand-800 ring-1 ring-brand-200">
          <span>
            Exibindo recomendações para: <strong>{demandaSelecionadaObj.titulo}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSelecionarDemandaFiltro(undefined)}
            className="font-medium hover:underline text-brand-700"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Skeletons de carregamento */}
      {carregando && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-brand-100 bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-brand-100" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 rounded bg-brand-100" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-brand-50" />
                </div>
              </div>
              <div className="mt-4 h-12 rounded bg-brand-50" />
              <div className="mt-4 flex gap-1.5">
                <div className="h-5 w-16 rounded-full bg-brand-100" />
                <div className="h-5 w-16 rounded-full bg-brand-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado Vazio */}
      {!carregando && recomendacoes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-surface px-6 py-12 text-center">
          <h3 className="font-display text-base font-semibold text-ink-900">
            Nenhuma startup recomendada no momento
          </h3>
        </div>
      )}

      {/* Lista de Cards de Startups Recomendadas */}
      {!carregando && recomendacoes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recomendacoes.map(({ startup, demanda, motivos }) => (
            <div
              key={`${demanda.id}-${startup.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-brand-100 bg-surface p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
            >
              <div>
                {/* Identificação da startup */}
                <div className="flex items-start gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 font-display text-sm font-bold text-white shadow-sm">
                    {startup.initials || startup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-bold text-ink-900 group-hover:text-brand-700">
                      {startup.name}
                    </h3>
                    <p className="text-xs text-ink-500">
                      {startup.city}, {startup.state} • {startup.stage === 'scaling' ? 'Escala' : 'Tração'}
                    </p>
                  </div>
                </div>

                {/* Descrição resumida */}
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-600">
                  {startup.description || startup.tagline}
                </p>

                {/* Demanda vinculada */}
                <div className="mt-3 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] text-ink-700">
                  <span className="text-ink-500">Demanda associada:</span>
                  <p className="truncate font-medium text-brand-800">{demanda.titulo}</p>
                </div>

                {/* Motivos de afinidade / tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {motivos.map((motivo) => (
                    <span
                      key={motivo}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-800 ring-1 ring-brand-200"
                    >
                      {motivo}
                    </span>
                  ))}
                </div>

                {/* Serviços & Tecnologias */}
                <div className="mt-3 flex flex-wrap gap-1 border-t border-brand-100 pt-2.5">
                  {startup.services.slice(0, 2).map((srv) => (
                    <span
                      key={srv}
                      className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-ink-600"
                    >
                      {srv}
                    </span>
                  ))}
                  {startup.technologies.slice(0, 2).map((tec) => (
                    <span
                      key={tec}
                      className="rounded-md bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700"
                    >
                      {tec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botão Ver perfil */}
              <div className="mt-5 border-t border-brand-100 pt-3">
                <button
                  type="button"
                  onClick={() => onVerPerfil(startup, demanda.id)}
                  className="flex w-full items-center justify-center rounded-xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
                >
                  Ver perfil completo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

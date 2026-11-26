import { CheckIcon, CloseIcon, SparklesIcon } from '@/components/icons.tsx'
import type { Demanda, Recomendacao } from '@/lib/demandas.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'
import { useState } from 'react'

type PainelRecomendacoesProps = {
  recomendacoes: Recomendacao[]
  demandas: Demanda[]
  demandaAtivaId?: string
  carregando: boolean
  modo?: 'dashboard' | 'pagina'
  onSelecionarDemandaFiltro: (id?: string) => void
  onVerPerfil: (startup: StartupCatalogo, demandaId?: string) => void
}

const CHAVE_DESBLOQUEIO = 'recintech:desbloqueio_recomendacoes'

export default function PainelRecomendacoes({
  recomendacoes,
  demandas,
  demandaAtivaId,
  carregando,
  modo = 'dashboard',
  onSelecionarDemandaFiltro,
  onVerPerfil,
}: PainelRecomendacoesProps) {
  const demandaSelecionadaObj = demandas.find((d) => d.id === demandaAtivaId)

  // Controle de Monetização / Paywall
  const [desbloqueado, setDesbloqueado] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(CHAVE_DESBLOQUEIO) === 'true'
  })
  const [modalDesbloqueio, setModalDesbloqueio] = useState(false)
  const [apenasDestaques, setApenasDestaques] = useState(false)

  function handleConfirmarDesbloqueio() {
    localStorage.setItem(CHAVE_DESBLOQUEIO, 'true')
    try {
      const chaveContratos = 'recintech:desbloqueios_contratados'
      const raw = localStorage.getItem(chaveContratos)
      const list = raw ? JSON.parse(raw) : []
      if (!list.includes('empresa-atual')) {
        list.push('empresa-atual')
        localStorage.setItem(chaveContratos, JSON.stringify(list))
      }
    } catch {
      // silencia
    }
    setDesbloqueado(true)
    setModalDesbloqueio(false)
  }

  function handleRestaurarBloqueio() {
    localStorage.removeItem(CHAVE_DESBLOQUEIO)
    setDesbloqueado(false)
  }

  const recomendacoesFiltradas = apenasDestaques
    ? recomendacoes.filter((r) => r.emDestaque || r.startup.emDestaque)
    : recomendacoes

  // Se não estiver desbloqueado, apenas as 3 primeiras estão totalmente visíveis
  const LIMITE_GRATUITO = 3
  const precisaDePaywall = !desbloqueado && recomendacoesFiltradas.length > LIMITE_GRATUITO

  return (
    <section
      {...(modo === 'pagina'
        ? { 'aria-label': 'Startups recomendadas' }
        : { 'aria-labelledby': 'titulo-recomendacoes' })}
      className="flex flex-col gap-4"
    >
      {modo === 'pagina' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setApenasDestaques((v) => !v)}
            className={[
              'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
              apenasDestaques
                ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-300'
                : 'border-brand-200 bg-surface text-ink-700 hover:bg-brand-50',
            ].join(' ')}
            aria-pressed={apenasDestaques}
          >
            <span>{apenasDestaques ? 'Apenas Destaques (Ativo)' : 'Filtrar Destaques'}</span>
          </button>

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
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="titulo-recomendacoes" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
                Startups recomendadas
              </h2>
              {!carregando && (
                <span className="text-base font-semibold text-ink-500 sm:text-lg">
                  ({recomendacoesFiltradas.length})
                </span>
              )}
              {desbloqueado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckIcon className="size-3" />
                  Lista Completa Desbloqueada
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-500 sm:text-sm">
              Startups compatíveis com as necessidades e tecnologias que a sua empresa procura.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setApenasDestaques((v) => !v)}
              className={[
                'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                apenasDestaques
                  ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-300'
                  : 'border-brand-200 bg-surface text-ink-700 hover:bg-brand-50',
              ].join(' ')}
              aria-pressed={apenasDestaques}
            >
              <span>{apenasDestaques ? 'Apenas Destaques (Ativo)' : 'Filtrar Destaques'}</span>
            </button>

            {desbloqueado && (
              <button
                type="button"
                onClick={handleRestaurarBloqueio}
                className="text-[11px] text-ink-500 underline hover:text-ink-700"
              >
                Simular bloqueio (demonstração)
              </button>
            )}

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
        </div>
      )}

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
              className="animate-pulse rounded-2xl bg-surface p-5 shadow-sm"
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
      {!carregando && recomendacoesFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface px-6 py-12 text-center shadow-sm">
          <h3 className="font-display text-base font-semibold text-ink-900">
            {apenasDestaques
              ? 'Nenhuma startup em destaque encontrada para esta seleção'
              : 'Nenhuma startup recomendada no momento'}
          </h3>
          {apenasDestaques && (
            <button
              type="button"
              onClick={() => setApenasDestaques(false)}
              className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
            >
              Ver todas as recomendações
            </button>
          )}
        </div>
      )}

      {/* Lista de Cards de Startups Recomendadas */}
      {!carregando && recomendacoesFiltradas.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recomendacoesFiltradas.map(({ startup, demanda, motivos, scoreCompatibilidade, emDestaque }, index) => {
            const estaBloqueado = !desbloqueado && index >= LIMITE_GRATUITO

            return (
              <div
                key={`${demanda.id}-${startup.id}`}
                className={[
                  'group relative flex flex-col justify-between rounded-2xl bg-surface p-5 shadow-sm transition-all',
                  emDestaque
                    ? 'ring-2 ring-amber-400 bg-gradient-to-b from-amber-50/30 to-surface shadow-md'
                    : 'hover:-translate-y-0.5 hover:shadow-md',
                  estaBloqueado ? 'overflow-hidden select-none' : '',
                ].join(' ')}
              >
                {/* Camada borrada para cards bloqueados pelo paywall */}
                <div className={estaBloqueado ? 'blur-sm pointer-events-none opacity-40' : ''}>
                  {/* Identificação da startup */}
                  <div className="flex items-start gap-3">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 font-display text-sm font-bold text-white shadow-sm">
                      {startup.initials || startup.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="truncate font-display text-base font-bold text-ink-900 group-hover:text-brand-700">
                          {estaBloqueado ? 'Startup Confidencial' : startup.name}
                        </h3>
                        {scoreCompatibilidade && (
                          <span className="shrink-0 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-700">
                            {scoreCompatibilidade}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-500">
                        {startup.city}, {startup.state} • {startup.stage === 'scaling' ? 'Escala' : 'Tração'}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Destaque / Patrocinado (Monetização Startup) */}
                  {emDestaque && (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-400/50">
                        ⭐ Destaque Patrocinado
                      </span>
                    </div>
                  )}

                  {/* Descrição resumida */}
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-600">
                    {estaBloqueado ? 'Descrição detalhada e serviços protegidos pelo plano gratuito. Desbloqueie para visualizar.' : (startup.description || startup.tagline)}
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
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-gray-100 pt-2.5">
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

                {/* Overlay de Bloqueio se o card estiver além do limite gratuito */}
                {estaBloqueado ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[2px] p-4 text-center">
                    <div className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700 shadow-sm">
                      🔒
                    </div>
                    <p className="mt-2 text-xs font-bold text-ink-900">
                      Recomendação Bloqueada
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      Top 3 gratuito já atingido
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalDesbloqueio(true)}
                      className="mt-3 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-700"
                    >
                      Desbloquear
                    </button>
                  </div>
                ) : (
                  /* Botão Ver perfil normal */
                  <div className="mt-5 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onVerPerfil(startup, demanda.id)}
                      className="flex w-full items-center justify-center rounded-xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
                    >
                      Ver perfil completo
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Banner chamativo de Paywall se houver itens bloqueados */}
          {precisaDePaywall && (
            <div className="col-span-full mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-accent-300 bg-gradient-to-r from-brand-50/90 via-surface to-accent-50/90 p-6 text-center shadow-md sm:flex-row sm:text-left sm:p-8">
              <div className="flex items-center gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-sm">
                  <SparklesIcon className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink-900 sm:text-lg">
                    Desbloqueie a lista completa de startups recomendadas
                  </h3>
                  <p className="mt-1 text-xs text-ink-600 sm:text-sm">
                    Você está visualizando as <strong>3 startups mais recomendadas</strong>. Desbloqueie o acesso irrestrito para ver todas as startups compatíveis com as demandas da sua empresa.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDesbloqueio(true)}
                className="shrink-0 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Desbloquear lista completa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Desbloqueio (Paywall de Monetização para Empresa) */}
      {modalDesbloqueio && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-desbloqueio-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <button
            type="button"
            aria-label="Fechar modal de desbloqueio"
            onClick={() => setModalDesbloqueio(false)}
            className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm cursor-default"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
            <div className="flex items-start justify-between border-b border-brand-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-sm">
                  <SparklesIcon className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600">
                    Monetização & Acesso Pro
                  </span>
                  <h3 id="modal-desbloqueio-titulo" className="font-display text-lg font-bold text-ink-900 sm:text-xl">
                    Desbloqueio de Recomendações
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDesbloqueio(false)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-brand-50"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="py-5 text-sm text-ink-700">
              <p className="leading-relaxed">
                No plano gratuito, sua empresa visualiza as <strong>3 primeiras startups mais recomendadas</strong> pelo nosso algoritmo de compatibilidade.
              </p>

              <div className="mt-4 rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
                <h4 className="font-semibold text-ink-900">Benefícios ao desbloquear a lista completa:</h4>
                <ul className="mt-2.5 space-y-2 text-xs text-ink-600">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4 shrink-0 text-brand-600" />
                    Visualização ilimitada de todas as startups recomendadas para todas as suas demandas.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4 shrink-0 text-brand-600" />
                    Acesso aos orçamentos estimados e propostas de valor detalhadas.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4 shrink-0 text-brand-600" />
                    Solicitação direta de reuniões e conexão sem intermediários.
                  </li>
                </ul>
              </div>

              <div className="mt-5 rounded-xl border border-accent-200 bg-accent-50/50 p-3.5 text-center">
                <span className="text-xs text-ink-500">Valor do desbloqueio para a empresa</span>
                <p className="mt-1 text-2xl font-extrabold text-brand-900">
                  R$ 79,00 <span className="text-xs font-normal text-ink-500">/ demanda</span>
                </p>
                <p className="mt-1 text-[11px] text-ink-500">
                  (Simulação da plataforma para a apresentação do PI)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-brand-100 pt-4">
              <button
                type="button"
                onClick={() => setModalDesbloqueio(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-ink-600 hover:bg-brand-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesbloqueio}
                className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
              >
                Confirmar Desbloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

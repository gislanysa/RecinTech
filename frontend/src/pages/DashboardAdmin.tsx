import {
  BuildingIcon,
  CheckIcon,
  CreditCardIcon,
  RocketIcon,
  TargetIcon,
  TrendingUpIcon,
} from '@/components/icons.tsx'
import {
  calcularMetricasGlobais,
  obterEmpresasAdmin,
  obterStartupsAdmin,
  type EmpresaAdmin,
  type MetricasPlataforma,
  type StartupAdmin,
} from '@/lib/admin.ts'
import { obterDemandasReais } from '@/lib/demandas.ts'
import { formatarMoeda, formatarPorteEmpresa } from '@/lib/formatadores.ts'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function extrairOrcamentoNumerico(d: { orcamento?: number }): number {
  return typeof d.orcamento === 'number' ? d.orcamento : 0
}

export default function DashboardAdmin() {
  const [metricas, setMetricas] = useState<MetricasPlataforma>(() => calcularMetricasGlobais())
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>(() => obterEmpresasAdmin().slice(0, 4))
  const [startups, setStartups] = useState<StartupAdmin[]>(() => obterStartupsAdmin().slice(0, 4))
  const [demandas, setDemandas] = useState(() => obterDemandasReais())

  useEffect(() => {
    function atualizar() {
      setMetricas(calcularMetricasGlobais())
      setEmpresas(obterEmpresasAdmin().slice(0, 4))
      setStartups(obterStartupsAdmin().slice(0, 4))
      setDemandas(obterDemandasReais())
    }
    window.addEventListener('storage', atualizar)
    return () => window.removeEventListener('storage', atualizar)
  }, [])

  const totalDemandas = demandas.length
  const demandasAte20k = useMemo(
    () => demandas.filter((d) => {
      const v = extrairOrcamentoNumerico(d)
      return v > 0 && v <= 20000
    }).length,
    [demandas],
  )
  const demandas20ka50k = useMemo(
    () => demandas.filter((d) => {
      const v = extrairOrcamentoNumerico(d)
      return v > 20000 && v <= 50000
    }).length,
    [demandas],
  )
  const demandasAcima50k = useMemo(
    () => demandas.filter((d) => {
      const v = extrairOrcamentoNumerico(d)
      return v > 50000
    }).length,
    [demandas],
  )

  const pctAte20k = totalDemandas > 0 ? Math.round((demandasAte20k / totalDemandas) * 100) : 0
  const pct20ka50k = totalDemandas > 0 ? Math.round((demandas20ka50k / totalDemandas) * 100) : 0
  const pctAcima50k = totalDemandas > 0 ? Math.round((demandasAcima50k / totalDemandas) * 100) : 0

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Cabeçalho */}
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Administrador
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Visão consolidada de usuários, demandas tecnológicas, monetização e saúde do ecossistema.
        </p>
      </header>

      {/* 2. Cards de Métricas Principais */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card Startups */}
        <div className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-500">Startups</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-700">
              <RocketIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink-900">{metricas.totalStartups}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span>{metricas.startupsAtivas} ativas</span>
            <span>{metricas.startupsDestaque} em destaque</span>
          </div>
        </div>

        {/* Card Empresas */}
        <div className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-500">Empresas</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-700">
              <BuildingIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink-900">{metricas.totalEmpresas}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span>{metricas.empresasAtivas} verificadas</span>
            <span>100% ativas</span>
          </div>
        </div>

        {/* Card Demandas e Volume R$ */}
        <div className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-500">Demandas & Volume</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-700">
              <TargetIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-ink-900">
            {formatarMoeda(metricas.volumeFinanceiroTotal)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span>{metricas.totalDemandas} cadastradas</span>
            <span>{metricas.demandasAbertas} abertas</span>
          </div>
        </div>

        {/* Card Matchmaking */}
        <div className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-500">Matchmaking</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-700">
              <TrendingUpIcon className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-ink-900">{metricas.taxaConversaoMatches}%</p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span>Conversão estimada</span>
            <span>{metricas.totalAdmins} admins ativos</span>
          </div>
        </div>
      </section>

      {/* 3. Indicadores de Desempenho e Modelo de Negócio */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs sm:p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-ink-900">
            Distribuição de Demandas por Faixa Orçamentária
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Acompanhamento do teto financeiro definido pelas empresas nas oportunidades abertas
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-ink-700">
                <span>Até R$ 20.000 (Pequeno porte / MVPs)</span>
                <span>
                  {pctAte20k}% ({demandasAte20k} {demandasAte20k === 1 ? 'demanda' : 'demandas'})
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-brand-50">
                <div
                  className="h-2.5 rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${pctAte20k}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-ink-700">
                <span>R$ 20.000 a R$ 50.000 (Médio porte / Projetos integrados)</span>
                <span>
                  {pct20ka50k}% ({demandas20ka50k} {demandas20ka50k === 1 ? 'demanda' : 'demandas'})
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-brand-50">
                <div
                  className="h-2.5 rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${pct20ka50k}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-ink-700">
                <span>Acima de R$ 50.000 (Grande porte / Transformação digital)</span>
                <span>
                  {pctAcima50k}% ({demandasAcima50k} {demandasAcima50k === 1 ? 'demanda' : 'demandas'})
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full rounded-full bg-brand-50">
                <div
                  className="h-2.5 rounded-full bg-accent-500 transition-all duration-300"
                  style={{ width: `${pctAcima50k}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-brand-100 pt-4 text-xs text-ink-500">
            <span>
              Volume total orçado pelas empresas:{' '}
              <strong className="text-ink-900">{formatarMoeda(metricas.volumeFinanceiroTotal)}</strong>
            </span>
            <Link
              to="/dashboard/admin/startups"
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver startups aptas →
            </Link>
          </div>
        </div>

        {/* Modelo de Monetização e Governança */}
        <div className="flex flex-col justify-between rounded-card border border-brand-100 bg-surface p-5 shadow-xs sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="size-5 text-ink-700" />
              <h2 className="text-base font-semibold text-ink-900">Monetização Ativa</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Acompanhamento de pacotes contratados pelas startups e empresas
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-brand-100 bg-surface-2 p-3">
                <span className="text-xs font-semibold text-ink-900">Plano Destaque</span>
                {metricas.pacotesDestaqueContratados > 0 ? (
                  <p className="mt-1 text-xs font-medium text-ink-700">
                    {metricas.pacotesDestaqueContratados}{' '}
                    {metricas.pacotesDestaqueContratados === 1
                      ? 'startup contratou o pacote'
                      : 'startups contrataram o pacote'}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-ink-500">
                    Nenhum pacote contratado no momento.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-brand-100 bg-surface-2 p-3">
                <span className="text-xs font-semibold text-ink-900">Desbloqueio de Lista</span>
                {metricas.pacotesDesbloqueioContratados > 0 ? (
                  <p className="mt-1 text-xs font-medium text-ink-700">
                    {metricas.pacotesDesbloqueioContratados}{' '}
                    {metricas.pacotesDesbloqueioContratados === 1
                      ? 'empresa contratou o desbloqueio'
                      : 'empresas contrataram o desbloqueio'}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-ink-500">
                    Nenhum pacote contratado no momento.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-brand-100 bg-surface-2 p-3 text-xs text-ink-700">
            <div className="flex items-center gap-1.5 font-semibold text-ink-900">
              <CheckIcon className="size-4 text-ink-600" />
              Governança & LGPD
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              Termos de uso e consentimentos versionados e auditáveis no painel.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Tabelas de Resumo Operacional */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Startups Recentes */}
        <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Startups Cadastradas</h2>
            <Link
              to="/dashboard/admin/startups"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver todas ({metricas.totalStartups})
            </Link>
          </div>
          {startups.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-500">
              Nenhuma startup cadastrada até o momento.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-brand-100 text-xs">
              {startups.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-ink-900">{s.name}</p>
                    <p className="text-ink-500">{s.city}/{s.state} · {s.stage}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.emDestaque && (
                      <span className="rounded-full border border-brand-100 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                        Destaque
                      </span>
                    )}
                    <span className="rounded-full border border-brand-100 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                      {s.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Empresas Recentes */}
        <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-100 pb-3">
            <h2 className="text-sm font-semibold text-ink-900">Empresas Cadastradas</h2>
            <Link
              to="/dashboard/admin/empresas"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver todas ({metricas.totalEmpresas})
            </Link>
          </div>
          {empresas.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-500">
              Nenhuma empresa cadastrada até o momento.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-brand-100 text-xs">
              {empresas.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-ink-900">{e.name}</p>
                    <p className="text-ink-500">{e.city}/{e.state} · Porte {formatarPorteEmpresa(e.size)}</p>
                  </div>
                  <span className="rounded-full border border-brand-100 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                    {e.is_active ? 'Verificada' : 'Suspensa'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

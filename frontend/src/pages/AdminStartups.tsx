import { SearchIcon, SparklesIcon } from '@/components/icons.tsx'
import {
  obterStartupsAdmin,
  salvarStatusStartupAdmin,
  type StartupAdmin,
} from '@/lib/admin.ts'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function AdminStartups() {
  const [busca, setBusca] = useState('')
  const [filtroEstagio, setFiltroEstagio] = useState<'todos' | 'traction' | 'scaling'>('todos')
  const [filtroDestaque, setFiltroDestaque] = useState<'todos' | 'destaque'>('todos')
  const [startups, setStartups] = useState<StartupAdmin[]>(() => obterStartupsAdmin())
  const [notificacao, setNotificacao] = useState('')

  useEffect(() => {
    function atualizar() {
      setStartups(obterStartupsAdmin())
    }
    window.addEventListener('storage', atualizar)
    return () => window.removeEventListener('storage', atualizar)
  }, [])

  function handleToggleDestaque(startupId: string, destaqueAtual: boolean) {
    const novoValor = !destaqueAtual
    salvarStatusStartupAdmin(startupId, { emDestaque: novoValor })
    setStartups(obterStartupsAdmin())
    setNotificacao(`Destaque ${novoValor ? 'ativado' : 'removido'} com sucesso!`)
    setTimeout(() => setNotificacao(''), 3000)
  }

  function handleToggleAtivo(startupId: string, ativoAtual: boolean) {
    const novoValor = !ativoAtual
    salvarStatusStartupAdmin(startupId, { is_active: novoValor })
    setStartups(obterStartupsAdmin())
    setNotificacao(`Status da startup alterado para ${novoValor ? 'Ativo' : 'Inativo'}.`)
    setTimeout(() => setNotificacao(''), 3000)
  }

  const startupsFiltradas: StartupAdmin[] = useMemo(() => {
    return startups.filter((s) => {
      const emDestaque = Boolean(s.emDestaque)

      const termo = busca.trim().toLowerCase()
      const matchBusca =
        !termo ||
        s.name.toLowerCase().includes(termo) ||
        s.city?.toLowerCase().includes(termo) ||
        s.technologies?.some((t) => t.toLowerCase().includes(termo))

      const matchEstagio = filtroEstagio === 'todos' || s.stage === filtroEstagio
      const matchDestaque = filtroDestaque === 'todos' || (filtroDestaque === 'destaque' && emDestaque)

      return matchBusca && matchEstagio && matchDestaque
    })
  }, [startups, busca, filtroEstagio, filtroDestaque])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gerenciamento de Startups
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Controle de moderação, status de conta e atribuição do plano de destaque (patrocinado).
          </p>
        </div>
      </header>

      {notificacao && (
        <div className="rounded-xl border border-accent-300 bg-accent-100 p-3.5 text-xs font-medium text-ink-900">
          {notificacao}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-brand-100 bg-surface p-4 shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cidade ou tecnologia..."
            className="w-full rounded-xl border border-brand-200 bg-white py-2 pl-10 pr-3.5 text-sm text-ink-900 outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
          />
        </div>

        <select
          value={filtroEstagio}
          onChange={(e) => setFiltroEstagio(e.target.value as any)}
          className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="todos">Todos os estágios</option>
          <option value="traction">Tração</option>
          <option value="scaling">Escala</option>
        </select>

        <select
          value={filtroDestaque}
          onChange={(e) => setFiltroDestaque(e.target.value as any)}
          className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="todos">Todos os planos</option>
          <option value="destaque">Apenas Destaque (⭐⭐)</option>
        </select>
      </div>

      {/* Tabela de Startups */}
      <div className="overflow-x-auto rounded-card border border-brand-100 bg-surface shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-brand-100 bg-brand-50/70 text-ink-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Startup</th>
              <th className="px-4 py-3 font-semibold">Estágio</th>
              <th className="px-4 py-3 font-semibold">Localização</th>
              <th className="px-4 py-3 font-semibold">Tecnologias</th>
              <th className="px-4 py-3 font-semibold">Plano</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {startupsFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-500">
                  {startups.length === 0
                    ? 'Nenhuma startup cadastrada até o momento.'
                    : 'Nenhuma startup encontrada para os filtros aplicados.'}
                </td>
              </tr>
            ) : (
              startupsFiltradas.map((s) => {
                const emDestaque = Boolean(s.emDestaque)
                const ativo = s.is_active

                return (
                  <tr key={s.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-800">
                          {s.initials || s.name.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700 capitalize">{s.stage || 'Não informado'}</td>
                    <td className="px-4 py-3 text-ink-700">{s.city ? `${s.city}/${s.state || 'PE'}` : 'Não informado'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.technologies ?? []).slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 ring-1 ring-brand-100"
                          >
                            {t}
                          </span>
                        ))}
                        {((s.technologies?.length ?? 0) > 2) && (
                          <span className="text-[10px] text-ink-500">
                            +{(s.technologies?.length ?? 0) - 2}
                          </span>
                        )}
                        {(!s.technologies || s.technologies.length === 0) && (
                          <span className="text-[10px] text-ink-400">Geral</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {emDestaque ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <SparklesIcon className="size-3 text-amber-600" />
                          Destaque
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-ink-600">
                          Gratuito
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          ativo
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDestaque(s.id, emDestaque)}
                          title={emDestaque ? 'Remover destaque' : 'Promover a destaque'}
                          className="rounded-lg border border-brand-200 px-2 py-1 text-[11px] font-medium text-ink-700 hover:bg-brand-50"
                        >
                          {emDestaque ? 'Tirar Destaque' : 'Destacar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(s.id, ativo)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                            ativo
                              ? 'border border-red-200 text-red-600 hover:bg-red-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {ativo ? 'Suspender' : 'Ativar'}
                        </button>
                        <Link
                          to={`/startups/${s.id}`}
                          className="text-[11px] font-medium text-brand-600 hover:underline"
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

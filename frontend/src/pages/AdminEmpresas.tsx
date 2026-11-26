import { BuildingIcon, LinkIcon, SearchIcon } from '@/components/icons.tsx'
import {
  alternarStatusEmpresaAdmin,
  obterEmpresasAdmin,
  type EmpresaAdmin,
} from '@/lib/admin.ts'
import { formatarPorteEmpresa } from '@/lib/formatadores.ts'
import { useEffect, useMemo, useState } from 'react'

function formatarCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length !== 14) return valor
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>(() => obterEmpresasAdmin())
  const [busca, setBusca] = useState('')
  const [filtroPorte, setFiltroPorte] = useState<string>('todos')
  const [notificacao, setNotificacao] = useState('')

  useEffect(() => {
    function atualizar() {
      setEmpresas(obterEmpresasAdmin())
    }
    window.addEventListener('storage', atualizar)
    return () => window.removeEventListener('storage', atualizar)
  }, [])

  function handleToggleStatus(empresaId: string) {
    try {
      alternarStatusEmpresaAdmin(empresaId)
      setEmpresas(obterEmpresasAdmin())
      setNotificacao('Status da empresa alterado com sucesso!')
      setTimeout(() => setNotificacao(''), 3000)
    } catch {
      // erro
    }
  }

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((e) => {
      const termo = busca.trim().toLowerCase()
      const matchBusca =
        !termo ||
        e.name.toLowerCase().includes(termo) ||
        e.city.toLowerCase().includes(termo) ||
        e.email.toLowerCase().includes(termo)

      const matchPorte = filtroPorte === 'todos' || e.size === filtroPorte

      return matchBusca && matchPorte
    })
  }, [empresas, busca, filtroPorte])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gerenciamento de Empresas
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Acompanhamento de organizações contratantes, porte, CNPJ e validação cadastral.
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
            placeholder="Buscar por nome, cidade ou e-mail..."
            className="w-full rounded-xl border border-brand-200 bg-white py-2 pl-10 pr-3.5 text-sm text-ink-900 outline-none focus:border-transparent focus:ring-2 focus:ring-accent-500"
          />
        </div>

        <select
          value={filtroPorte}
          onChange={(e) => setFiltroPorte(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="todos">Todos os portes</option>
          <option value="micro">Microempresa</option>
          <option value="small">Pequeno</option>
          <option value="medium">Médio</option>
          <option value="big">Grande</option>
        </select>
      </div>

      {/* Tabela de Empresas */}
      <div className="overflow-x-auto rounded-card border border-brand-100 bg-surface shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-brand-100 bg-brand-50/70 text-ink-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Empresa</th>
              <th className="px-4 py-3 font-semibold">Porte</th>
              <th className="px-4 py-3 font-semibold">CNPJ</th>
              <th className="px-4 py-3 font-semibold">Localização</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {empresasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-500">
                  {empresas.length === 0
                    ? 'Nenhuma empresa cadastrada até o momento.'
                    : 'Nenhuma empresa encontrada para os filtros aplicados.'}
                </td>
              </tr>
            ) : (
              empresasFiltradas.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <BuildingIcon className="size-3.5" />
                      </div>
                      <span>{e.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatarPorteEmpresa(e.size)}</td>
                  <td className="px-4 py-3 text-ink-700">{formatarCnpj(e.cnpj)}</td>
                  <td className="px-4 py-3 text-ink-700">{e.city}/{e.state}</td>
                  <td className="px-4 py-3 text-ink-700">{e.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        e.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {e.is_active ? 'Verificada' : 'Suspensa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {e.website && (
                        <a
                          href={e.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-600 hover:underline"
                        >
                          Site
                          <LinkIcon className="size-3 text-brand-400" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(e.id)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                          e.is_active
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {e.is_active ? 'Suspender' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import CartaoStartup, { CartaoStartupCarregando } from '@/components/explorar/CartaoStartup.tsx'
import PainelDeFiltros, {
  FILTROS_VAZIOS,
  cidadesDisponiveis,
  contarAtivos,
  type Filtros,
} from '@/components/explorar/PainelDeFiltros.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { restaurarSessao } from '@/lib/api.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'

type OrdenarPor = 'relevancia' | 'recentes' | 'nome'

function combina(startup: StartupCatalogo, busca: string, f: Filtros): boolean {
  const termo = busca.trim().toLowerCase()
  if (termo) {
    const texto = [
      startup.name,
      startup.tagline,
      startup.area,
      ...startup.services,
      ...startup.technologies,
      ...startup.segments,
      startup.city,
    ]
      .join(' ')
      .toLowerCase()
    if (!texto.includes(termo)) return false
  }
  if (f.areas.length && !f.areas.includes(startup.area)) return false
  if (f.services.length && !f.services.some((s) => startup.services.includes(s))) return false
  if (f.technologies.length && !f.technologies.some((t) => startup.technologies.includes(t))) return false
  if (f.segments.length && !f.segments.some((s) => startup.segments.includes(s))) return false
  if (f.states.length && !f.states.includes(startup.state)) return false
  if (f.cities.length && !f.cities.includes(startup.city)) return false
  if (f.remote && !startup.remote) return false
  if (f.onsite && !startup.onsite) return false
  return true
}

export default function ExplorarStartups() {
  const [todas, setTodas] = useState<StartupCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isAutenticado, setIsAutenticado] = useState(false)

  const [buscaDigitada, setBuscaDigitada] = useState('')
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [ordenar, setOrdenar] = useState<OrdenarPor>('relevancia')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  useEffect(() => {
    listarStartups().then((dados) => {
      setTodas(dados)
      setCarregando(false)
    })
    restaurarSessao().then((usuario) => {
      setIsAutenticado(!!usuario)
    })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && filtrosAbertos) {
        setFiltrosAbertos(false)
      }
    }
    if (filtrosAbertos) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [filtrosAbertos])

  const cidades = useMemo(() => cidadesDisponiveis(todas), [todas])

  const resultados = useMemo(() => {
    const filtradas = todas.filter((s) => combina(s, busca, filtros))
    if (ordenar === 'nome') return [...filtradas].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (ordenar === 'recentes') return [...filtradas].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return [...filtradas].sort((a, b) => b.relevance - a.relevance)
  }, [todas, busca, filtros, ordenar])

  const ativos = contarAtivos(filtros)

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS)
  }

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-brand-100 bg-surface-2">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore startups</h1>
            <p className="mt-3 max-w-2xl text-ink-500">
              Encontre empresas inovadoras por área de atuação, serviços, tecnologias e segmentos.
            </p>

            <div className="relative mt-8 inline-block">
              <input
                value={buscaDigitada}
                onChange={(e) => {
                  setBuscaDigitada(e.target.value)
                  setBusca(e.target.value)
                }}
                aria-label="O que você está procurando?"
                placeholder="Buscar..."
                name="search"
                type="text"
                className="input w-56 rounded-xl border border-gray-300 bg-surface pl-5 pr-16 py-3 text-base text-ink-900 shadow-lg outline-none transition-all placeholder:text-ink-500/70 focus:w-64 focus:border-2 focus:border-accent-500"
              />
              {buscaDigitada && (
                <button
                  type="button"
                  onClick={() => {
                    setBuscaDigitada('')
                    setBusca('')
                  }}
                  aria-label="Limpar busca"
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-5 text-gray-500"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink-900">
                {carregando ? 'Buscando startups...' : `${resultados.length} startups encontradas`}
              </p>
              {ativos > 0 && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {ativos} filtro(s) ativo(s) · limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Botão Filtros */}
              <button
                type="button"
                onClick={() => setFiltrosAbertos(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-surface px-4 py-2 text-sm font-semibold text-ink-800 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <svg
                  className="size-4 text-ink-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" x2="4" y1="21" y2="14" />
                  <line x1="4" x2="4" y1="10" y2="3" />
                  <line x1="12" x2="12" y1="21" y2="12" />
                  <line x1="12" x2="12" y1="8" y2="3" />
                  <line x1="20" x2="20" y1="21" y2="16" />
                  <line x1="20" x2="20" y1="12" y2="3" />
                  <line x1="1" x2="7" y1="14" y2="14" />
                  <line x1="9" x2="15" y1="8" y2="8" />
                  <line x1="17" x2="23" y1="16" y2="16" />
                </svg>
                <span>Filtros</span>
                {ativos > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {ativos}
                  </span>
                )}
              </button>

              {/* Botão de Ordenação */}
              <div className="relative">
                <select
                  value={ordenar}
                  onChange={(e) => setOrdenar(e.target.value as OrdenarPor)}
                  aria-label="Ordenar startups"
                  className="rounded-xl border border-gray-300 bg-surface px-3.5 py-2 text-sm font-medium text-ink-800 shadow-sm outline-none transition-all hover:border-gray-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500"
                >
                  <option value="relevancia">Mais relevantes</option>
                  <option value="recentes">Mais recentes</option>
                  <option value="nome">Nome A–Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {carregando ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CartaoStartupCarregando key={i} />
                ))}
              </div>
            ) : resultados.length === 0 ? (
              <div className="rounded-card border border-dashed border-gray-200 bg-surface px-6 py-16 text-center">
                <h2 className="text-lg font-semibold text-ink-900">Nenhuma startup encontrada</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
                  Não encontramos startups com esses filtros. Experimente remover alguns filtros ou
                  realizar uma nova busca.
                </p>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.map((startup) => (
                  <CartaoStartup key={startup.slug} startup={startup} isAutenticado={isAutenticado} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Backdrop escurecido */}
        {filtrosAbertos && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setFiltrosAbertos(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Drawer de Filtros */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-in-out sm:w-96',
            filtrosAbertos ? 'translate-x-0' : '-translate-x-full pointer-events-none',
          ].join(' ')}
          aria-label="Filtros de startups"
        >
          {/* Header da Sidebar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink-900">Filtros</h2>
              {ativos > 0 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {ativos} ativo{ativos > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {ativos > 0 && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
                >
                  Limpar tudo
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltrosAbertos(false)}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-gray-100 hover:text-ink-900"
                aria-label="Fechar filtros"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <PainelDeFiltros
              filtros={filtros}
              setFiltros={setFiltros}
              cidades={cidades}
              onLimpar={limparFiltros}
            />
          </div>

          {/* Rodapé com botão de confirmação */}
          <div className="border-t border-gray-200 bg-surface p-4">
            <button
              type="button"
              onClick={() => setFiltrosAbertos(false)}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Ver {resultados.length} {resultados.length === 1 ? 'startup' : 'startups'}
            </button>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  )
}
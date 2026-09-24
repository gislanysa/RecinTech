import CartaoStartup, { CartaoStartupCarregando } from '@/components/explorar/CartaoStartup.tsx'
import PainelDeFiltros, {
  FILTROS_VAZIOS,
  cidadesDisponiveis,
  contarAtivos,
  type Filtros,
} from '@/components/explorar/PainelDeFiltros.tsx'
import { SearchIcon } from '@/components/icons.tsx'
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
  const [rascunho, setRascunho] = useState<Filtros>(FILTROS_VAZIOS)
  const [aplicados, setAplicados] = useState<Filtros>(FILTROS_VAZIOS)
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

  const cidades = useMemo(() => cidadesDisponiveis(todas), [todas])

  const resultados = useMemo(() => {
    const filtradas = todas.filter((s) => combina(s, busca, aplicados))
    if (ordenar === 'nome') return [...filtradas].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (ordenar === 'recentes') return [...filtradas].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return [...filtradas].sort((a, b) => b.relevance - a.relevance)
  }, [todas, busca, aplicados, ordenar])

  const ativos = contarAtivos(aplicados)

  function limparFiltros() {
    setRascunho(FILTROS_VAZIOS)
    setAplicados(FILTROS_VAZIOS)
  }

  function aplicarFiltros() {
    setAplicados(rascunho)
    setFiltrosAbertos(false)
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

            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                setBusca(buscaDigitada)
              }}
            >
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
                <input
                  value={buscaDigitada}
                  onChange={(e) => setBuscaDigitada(e.target.value)}
                  aria-label="O que você está procurando?"
                  placeholder="Ex.: desenvolvimento de aplicativo, inteligência artificial, UX/UI..."
                  className="h-14 w-full rounded-2xl border border-brand-200 bg-surface pl-11 pr-4 text-base text-ink-900 shadow-sm outline-none placeholder:text-ink-500/70 focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <button
                type="submit"
                className="h-14 shrink-0 rounded-2xl bg-brand-600 px-8 text-base font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Buscar
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex gap-8">
            {/* Filtros — sempre visíveis a partir de lg; abaixo disso, um botão abre/fecha. */}
            <aside className={['w-72 shrink-0', filtrosAbertos ? 'block' : 'hidden', 'lg:block'].join(' ')}>
              <div className="rounded-card border border-brand-100 bg-surface p-5 lg:sticky lg:top-24">
                <p className="mb-2 text-sm font-semibold text-ink-900">Filtros</p>
                <PainelDeFiltros
                  rascunho={rascunho}
                  setRascunho={setRascunho}
                  cidades={cidades}
                  onAplicar={aplicarFiltros}
                  onLimpar={limparFiltros}
                />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink-900">
                    {carregando ? 'Buscando startups...' : `${resultados.length} startups encontradas`}
                  </p>
                  {ativos > 0 && (
                    <button
                      type="button"
                      onClick={limparFiltros}
                      className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                    >
                      {ativos} filtro(s) ativo(s) · limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltrosAbertos((v) => !v)}
                    className="inline-flex items-center rounded-xl border border-brand-200 px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 lg:hidden"
                  >
                    {filtrosAbertos ? 'Ocultar filtros' : 'Filtrar resultados'}
                  </button>

                  <select
                    value={ordenar}
                    onChange={(e) => setOrdenar(e.target.value as OrdenarPor)}
                    className="rounded-xl border border-brand-200 bg-surface px-3.5 py-2 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="relevancia">Mais relevantes</option>
                    <option value="recentes">Mais recentes</option>
                    <option value="nome">Nome A–Z</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                {carregando ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <CartaoStartupCarregando key={i} />
                    ))}
                  </div>
                ) : resultados.length === 0 ? (
                  <div className="rounded-card border border-dashed border-brand-200 bg-surface px-6 py-16 text-center">
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
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {resultados.map((startup) => (
                      <CartaoStartup key={startup.slug} startup={startup} isAutenticado={isAutenticado} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
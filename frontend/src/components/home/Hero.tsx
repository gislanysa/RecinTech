import PreviaDoMatch from '@/components/home/PreviaDoMatch.tsx'
import { ArrowRightIcon, SearchIcon } from '@/components/icons.tsx'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/** Atalhos que preenchem a busca. Vão virar filtros de `GET /search`. */
const ATALHOS = [
  'Desenvolvimento mobile',
  'Inteligência artificial',
  'Análise de dados',
  'UX/UI Design',
]

export default function Hero() {
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  function buscar(termo: string) {
    const q = termo.trim()
    navigate(q ? `/startups?q=${encodeURIComponent(q)}` : '/startups')
  }

  return (
    // -mt-16 puxa a seção para trás do cabeçalho transparente (h-16).
    <section className="relative -mt-16 overflow-hidden bg-canvas pt-16">
      {/* Brilho de fundo: dá profundidade sem pesar no tom claro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,var(--color-brand-100),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--color-accent-100),transparent_65%)] opacity-70 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* ---------- coluna da esquerda: a busca ---------- */}
          <div className="min-w-0">
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Encontre a startup certa para o que sua empresa precisa.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              Explore startups, descubra novas soluções e conecte sua empresa às oportunidades certas.
            </p>

            <form
              className="mt-8 max-w-xl"
              onSubmit={(event) => {
                event.preventDefault()
                buscar(busca)
              }}
            >
              <label htmlFor="busca" className="sr-only">
                O que sua empresa precisa?
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-lg shadow-ink-900/5 ring-1 ring-brand-200 focus-within:ring-2 focus-within:ring-accent-500">
                <SearchIcon className="ml-2 size-5 shrink-0 text-ink-500" />
                <input
                  id="busca"
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="app de gestão de pedidos, antifraude, telemedicina..."
                  // sem size={1} o input impõe ~20 caracteres de largura mínima
                  size={1}
                  className="w-full min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-500/70"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Buscar
                  <ArrowRightIcon className="size-4" />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-500">Populares:</span>
              {ATALHOS.map((atalho) => (
                <button
                  key={atalho}
                  type="button"
                  onClick={() => {
                    setBusca(atalho)
                    buscar(atalho)
                  }}
                  className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50"
                >
                  {atalho}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- coluna da direita: o match explicado ---------- */}
          <PreviaDoMatch />
        </div>
      </div>
    </section>
  )
}

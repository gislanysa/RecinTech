import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { AvatarStartup } from '@/components/explorar/CartaoStartup.tsx'
import { CloseIcon } from '@/components/icons.tsx'
import { calcularTempoAtuacao } from '@/lib/formatadores.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

type Ordem = 'recentes' | 'relevancia' | 'nome'

function textoDaStartup(s: StartupCatalogo): string {
  return [s.name, s.tagline, s.area, s.city, ...s.services, ...s.technologies, ...s.segments]
    .join(' ')
    .toLowerCase()
}

/**
 * Catálogo interno em formato de mural.
 *
 * Fica dentro do layout do dashboard (rota protegida), ao contrário de
 * `/startups`, que é a vitrine pública. Os cartões ficam em colunas com
 * alturas livres, como post-its num quadro, e abrem o perfil num painel.
 */
export default function MuralStartups() {
  const { conta } = useOutletContext<ContextoSessao>()
  const [todas, setTodas] = useState<StartupCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [area, setArea] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [aberta, setAberta] = useState<StartupCatalogo | null>(null)

  useEffect(() => {
    let ativo = true
    listarStartups({
      limit: 50,
      offset: 0,
      aoAtualizar: (startup) => {
        if (ativo) setTodas((atual) => atual.map((s) => (s.id === startup.id ? startup : s)))
      },
    }).then((dados) => {
      if (!ativo) return
      setTodas(dados)
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [])

  const outras = useMemo(() => todas.filter((s) => s.id !== conta.id), [todas, conta.id])
  const areas = useMemo(
    () => [...new Set(outras.map((s) => s.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [outras],
  )

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const filtradas = outras.filter(
      (s) => (!area || s.area === area) && (!termo || textoDaStartup(s).includes(termo)),
    )
    if (ordem === 'nome') return [...filtradas].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (ordem === 'relevancia') return [...filtradas].sort((a, b) => b.relevance - a.relevance)
    return [...filtradas].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [outras, busca, area, ordem])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Catálogo
        </h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          id="mural-busca"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, serviço, tecnologia ou cidade…"
          aria-label="Buscar startups"
          className="w-full rounded-xl border border-brand-200 bg-surface px-4 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/60 focus:border-transparent focus:ring-2 focus:ring-accent-500 sm:max-w-md sm:flex-1"
        />
        <select
          id="mural-ordem"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar startups"
          className="rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="recentes">Mais recentes</option>
          <option value="relevancia">Mais relevantes</option>
          <option value="nome">Nome A–Z</option>
        </select>
      </div>

      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por área">
          {['', ...areas].map((a) => {
            const ativo = area === a
            return (
              <button
                key={a || 'todas'}
                type="button"
                aria-pressed={ativo}
                onClick={() => setArea(a)}
                className={[
                  'rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors',
                  ativo
                    ? 'bg-brand-600 text-white ring-brand-700'
                    : 'bg-brand-50 text-ink-700 ring-brand-200 hover:bg-brand-100',
                ].join(' ')}
              >
                {a || 'Todas'}
              </button>
            )
          })}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-ink-500">Carregando o mural…</p>
      ) : resultados.length === 0 ? (
        <p className="rounded-card bg-surface px-6 py-14 text-center text-sm text-ink-500 shadow-sm">
          Nenhuma startup encontrada com esses filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((startup) => (
            <li key={startup.id}>
              <CartaoMural startup={startup} aoAbrir={() => setAberta(startup)} />
            </li>
          ))}
        </ul>
      )}

      {aberta && <PerfilNoMural startup={aberta} aoFechar={() => setAberta(null)} />}
    </div>
  )
}

function CartaoMural({
  startup,
  aoAbrir,
}: {
  startup: StartupCatalogo
  aoAbrir: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      aria-label={`Ver perfil de ${startup.name}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-card bg-surface p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
    >
      <div className="flex items-center gap-3">
        <AvatarStartup startup={startup} />
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-ink-900">{startup.name}</h2>
          <p className="truncate text-xs text-ink-500">
            {[startup.area, `${startup.city}, ${startup.state}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {startup.tagline && <p className="mt-3 text-sm text-ink-700">{startup.tagline}</p>}

      {startup.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {startup.services.slice(0, 3).map((s) => (
            <span key={s} className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-700">
              {s}
            </span>
          ))}
        </div>
      )}

      {startup.technologies.length > 0 && (
        <p className="mt-2 text-xs text-ink-500">{startup.technologies.slice(0, 4).join(' · ')}</p>
      )}

      <p className="mt-auto pt-4 text-xs font-medium text-brand-600 group-hover:underline">Ver perfil</p>
    </button>
  )
}

function Grupo({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{titulo}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {itens.map((item) => (
          <span
            key={item}
            className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PerfilNoMural({ startup, aoFechar }: { startup: StartupCatalogo; aoFechar: () => void }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mural-perfil-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div onClick={aoFechar} className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-surface shadow-2xl ring-1 ring-brand-100">
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <AvatarStartup startup={startup} tamanho="lg" />
            <div className="min-w-0">
              <h2 id="mural-perfil-titulo" className="font-display text-xl font-bold text-ink-900">
                {startup.name}
              </h2>
              <p className="mt-0.5 text-sm text-ink-500">
                {startup.city}, {startup.state} • {calcularTempoAtuacao(startup.created_at)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar perfil"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Sobre</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {startup.description?.trim() || startup.tagline || 'Esta startup ainda não escreveu uma descrição.'}
            </p>
          </div>
          <Grupo titulo="Área de atuação" itens={startup.area ? [startup.area] : []} />
          <Grupo titulo="Serviços" itens={startup.services} />
          <Grupo titulo="Tecnologias" itens={startup.technologies} />
          <Grupo titulo="Segmentos" itens={startup.segments} />
          {startup.website && (
            <a
              href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
            >
              {startup.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

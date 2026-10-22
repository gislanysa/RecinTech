import BotaoVoltar from '@/components/BotaoVoltar.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import type { Startup } from '@/lib/api.ts'
import { buscarStartupPorId, carregarTagsDaStartup, iniciais } from '@/lib/startups.ts'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type Tags = Awaited<ReturnType<typeof carregarTagsDaStartup>>

type Estado =
  | { situacao: 'carregando' }
  | { situacao: 'encontrada'; startup: Startup; tags: Tags | null }
  | { situacao: 'nao-encontrada' }
  | { situacao: 'erro' }

/** Mesma escala de tons do card da listagem. */
const CORES_AVATAR = ['bg-brand-600', 'bg-accent-600', 'bg-brand-800', 'bg-ink-700', 'bg-brand-400', 'bg-accent-700']

function corAvatar(chave: string): string {
  const soma = [...chave].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return CORES_AVATAR[soma % CORES_AVATAR.length]
}

function ListaDeTags({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null
  return (
    <div>
      <h2 className="font-display text-sm font-semibold text-ink-900">{titulo}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {itens.map((item) => (
          <span
            key={item}
            className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 ring-1 ring-brand-100"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PerfilStartup() {
  const { id } = useParams<{ id: string }>()
  const [estado, setEstado] = useState<Estado>({ situacao: 'carregando' })

  useEffect(() => {
    if (!id) return setEstado({ situacao: 'nao-encontrada' })

    setEstado({ situacao: 'carregando' })

    buscarStartupPorId(id)
      .then((startup) => {
        setEstado({ situacao: 'encontrada', startup, tags: null })
        // As tags vêm de quatro rotas separadas; o perfil aparece antes delas
        // e se completa quando chegam, como no resto da aplicação.
        return carregarTagsDaStartup(id).then((tags) =>
          setEstado({ situacao: 'encontrada', startup, tags }),
        )
      })
      .catch((erro) => {
        const naoExiste = axios.isAxiosError(erro) && erro.response?.status === 404
        setEstado({ situacao: naoExiste ? 'nao-encontrada' : 'erro' })
      })
  }, [id])

  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        {estado.situacao === 'carregando' && <Esqueleto />}

        {estado.situacao === 'nao-encontrada' && (
          <Aviso
            titulo="Startup não encontrada"
            texto="O endereço pode estar errado, ou esta startup saiu da plataforma."
          />
        )}

        {estado.situacao === 'erro' && (
          <Aviso
            titulo="Não foi possível carregar o perfil"
            texto="Houve uma falha ao falar com o servidor. Tente novamente em instantes."
          />
        )}

        {estado.situacao === 'encontrada' && (
          <Conteudo startup={estado.startup} tags={estado.tags} />
        )}
      </main>
      <Footer />
    </>
  )
}

function Conteudo({ startup, tags }: { startup: Startup; tags: Tags | null }) {
  const area = tags?.area ?? ''

  return (
    <>
      <section className="border-b border-brand-100 bg-surface-2">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <BotaoVoltar to="/startups">Voltar para a busca</BotaoVoltar>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <span
              className={[
                'grid size-20 shrink-0 place-items-center rounded-full font-display text-2xl font-bold text-white',
                corAvatar(startup.id || startup.name),
              ].join(' ')}
            >
              {iniciais(startup.name)}
            </span>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{startup.name}</h1>
              <p className="mt-2 text-ink-500">
                {area && <span>{area} · </span>}
                {startup.city}, {startup.state}
              </p>
              {startup.website && (
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
                >
                  {startup.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div>
          <h2 className="font-display text-sm font-semibold text-ink-900">Sobre</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-700">
            {startup.description?.trim()
              ? startup.description
              : 'Esta startup ainda não escreveu uma descrição.'}
          </p>
        </div>

        {tags === null ? (
          <p className="mt-10 text-sm text-ink-500">Carregando serviços e tecnologias…</p>
        ) : tags.services.length + tags.technologies.length + tags.segments.length === 0 ? (
          <p className="mt-10 rounded-card border border-dashed border-brand-200 px-6 py-10 text-center text-sm text-ink-500">
            Esta startup ainda não cadastrou serviços, tecnologias ou segmentos.
          </p>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ListaDeTags titulo="Serviços" itens={tags.services} />
            <ListaDeTags titulo="Tecnologias" itens={tags.technologies} />
            <ListaDeTags titulo="Segmentos" itens={tags.segments} />
          </div>
        )}
      </section>
    </>
  )
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-ink-900">{titulo}</h1>
      <p className="mt-3 text-ink-500">{texto}</p>
      <div className="mt-8 flex justify-center">
        <BotaoVoltar to="/startups">Voltar para a busca</BotaoVoltar>
      </div>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-brand-100 bg-surface-2">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="h-4 w-36 rounded bg-brand-100" />
          <div className="mt-6 flex items-center gap-5">
            <div className="size-20 rounded-full bg-brand-100" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-64 max-w-full rounded bg-brand-100" />
              <div className="h-4 w-48 max-w-full rounded bg-brand-100" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="h-4 w-20 rounded bg-brand-100" />
        <div className="mt-4 h-4 w-full max-w-3xl rounded bg-brand-100" />
        <div className="mt-2 h-4 w-2/3 max-w-2xl rounded bg-brand-100" />
      </div>
    </div>
  )
}

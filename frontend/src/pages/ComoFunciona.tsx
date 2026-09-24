import { ChevronRightIcon, EyeIcon, HandshakeIcon, LinkIcon, SearchIcon, SparkIcon } from '@/components/icons.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const PASSOS = [
  {
    icon: SearchIcon,
    titulo: '1. Explore',
    descricao:
      'Pesquise startups por serviços, tecnologias, segmentos e áreas de atuação. Sem login e sem limite de buscas.',
  },
  {
    icon: EyeIcon,
    titulo: '2. Encontre',
    descricao: 'Abra perfis públicos completos com portfólio, stack, especialidades e segmentos atendidos.',
  },
  {
    icon: HandshakeIcon,
    titulo: '3. Conecte',
    descricao:
      'Cadastre sua empresa, descreva a necessidade e receba recomendações personalizadas com matchmaking.',
  },
]

const PERGUNTAS = [
  {
    pergunta: 'Preciso criar conta para pesquisar startups?',
    resposta:
      'Não. Home, busca com filtros avançados, ordenação e perfis públicos completos são abertos a qualquer visitante.',
  },
  {
    pergunta: 'O que exige cadastro?',
    resposta: 'Salvar startups, cadastrar necessidades, solicitar matchmaking e acessar o painel da empresa.',
  },
  {
    pergunta: 'Startups pagam para aparecer?',
    resposta:
      'Não. A ordenação considera relevância do perfil, atualização recente e compatibilidade com a necessidade descrita.',
  },
]

export default function ComoFunciona() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <SparkIcon className="size-3.5" />
            Busca sempre gratuita
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Como funciona</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-500">
            Você pode procurar sozinho, com filtros avançados, ou deixar a plataforma encontrar
            startups compatíveis com o seu projeto.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
          {/* Os três passos. */}
          <ol className="grid gap-5 md:grid-cols-3">
            {PASSOS.map(({ icon: Icon, titulo, descricao }) => (
              <li key={titulo} className="rounded-card border border-brand-100 bg-surface p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{descricao}</p>
              </li>
            ))}
          </ol>

          {/* Explicação do matchmaking. */}
          <div className="mt-10 rounded-card border border-brand-100 bg-surface p-8 sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <LinkIcon className="size-5" />
            </span>
            <div className="mt-4 sm:mt-0">
              <h2 className="text-lg font-semibold">Como o matchmaking avalia compatibilidade</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Comparamos os serviços e tecnologias que você pediu com o que cada startup entrega,
                o segmento em que ela já atua e as palavras-chave da descrição da sua necessidade.
                Cada recomendação vem com uma justificativa clara — e nenhuma startup recebe nota
                negativa.
              </p>
            </div>
          </div>

          <FAQ />

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/startups"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Explorar startups
            </Link>
            <Link
              to="/criar-conta"
              className="inline-flex items-center justify-center rounded-lg border border-brand-200 px-5 py-3 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              Cadastrar necessidade
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function FAQ() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <div className="mt-10 divide-y divide-brand-100 border-t border-b border-brand-100">
      {PERGUNTAS.map(({ pergunta, resposta }, indice) => {
        const expandida = aberta === indice
        return (
          <div key={pergunta}>
            <button
              type="button"
              onClick={() => setAberta(expandida ? null : indice)}
              aria-expanded={expandida}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-ink-900"
            >
              {pergunta}
              <ChevronRightIcon
                className={[
                  'size-4 shrink-0 text-ink-500 transition-transform',
                  expandida ? '-rotate-90' : 'rotate-90',
                ].join(' ')}
              />
            </button>
            {expandida && <p className="pb-4 text-sm leading-relaxed text-ink-500">{resposta}</p>}
          </div>
        )
      })}
    </div>
  )
}
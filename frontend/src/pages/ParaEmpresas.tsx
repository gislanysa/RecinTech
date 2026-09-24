import { ChevronRightIcon } from '@/components/icons.tsx'
import PassosComoFunciona from '@/components/PassosComoFunciona.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { useState } from 'react'

const PERGUNTAS = [
  {
    pergunta: 'Como o matchmaking avalia a compatibilidade?',
    resposta:
      'Comparamos os serviços e tecnologias que você pediu com o que cada startup entrega, o segmento em que ela já atua e as palavras-chave da descrição da sua necessidade. Cada recomendação vem com uma justificativa clara e nenhuma startup recebe nota negativa.',
  },
  {
    pergunta: 'Preciso criar conta para pesquisar startups?',
    resposta:
      'Não. A busca e os filtros avançados por tecnologias, serviços e segmentos são abertos para qualquer visitante. O cadastro gratuito é necessário para visualizar os nomes e perfis completos das startups.',
  },
  {
    pergunta: 'O que exige cadastro?',
    resposta:
      'Visualizar os dados e perfis completos das startups, salvar favoritas, cadastrar necessidades e solicitar matchmaking.',
  },
]

export default function ParaEmpresas() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-20">
          {/* O invólucro tem a largura do texto: é contra ele que o 100% da
              animação se resolve, então o cursor para junto da última letra. */}
          <div className="mx-auto w-fit">
            <h1 className="animate-digitando inline-block overflow-hidden whitespace-nowrap border-r-2 border-brand-600 pb-1.5 text-4xl font-bold tracking-tight sm:text-5xl">
              Como funciona?
            </h1>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-500">
            Você pode procurar sozinho, com filtros avançados, ou deixar a plataforma encontrar
            startups compatíveis com o seu projeto.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
          {/* Os três passos. */}
          <PassosComoFunciona />

          <h2 className="mt-16 text-xl font-semibold tracking-tight">Perguntas Frequentes</h2>

          <FAQ />

        </section>
      </main>
      <Footer />
    </>
  )
}

function FAQ() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <div className="mt-6 divide-y divide-brand-100 border-t border-b border-brand-100">
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
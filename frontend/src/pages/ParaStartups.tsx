import { BuildingIcon, CheckIcon, ChevronRightIcon, HandshakeIcon, LinkIcon, RocketIcon, SearchIcon, TrendingUpIcon } from '@/components/icons.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const PASSOS = [
  {
    icon: BuildingIcon,
    titulo: '1. Cadastre seu perfil',
    texto: 'Conte o que sua startup faz: serviços, tecnologias, segmentos de atuação e cases.',
  },
  {
    icon: SearchIcon,
    titulo: '2. Apareça nas buscas',
    texto: 'Seu perfil fica público e pesquisável — qualquer empresa encontra você sem precisar de login.',
  },
  {
    icon: LinkIcon,
    titulo: '3. Receba recomendações',
    texto: 'Quando uma empresa descreve uma necessidade compatível com seu perfil, você entra no matchmaking dela.',
  },
]

const BENEFICIOS = [
  {
    icon: RocketIcon,
    titulo: 'Visibilidade imediata',
    texto: 'Seu perfil aparece nas buscas públicas, sem exigir login de quem procura soluções.',
  },
  {
    icon: HandshakeIcon,
    titulo: 'Oportunidades qualificadas',
    texto: 'Empresas descrevem a necessidade e você é recomendada quando o perfil combina de verdade.',
  },
  {
    icon: TrendingUpIcon,
    titulo: 'Portfólio que converte',
    texto: 'Mostre projetos, resultados obtidos, stack e metodologias em um perfil completo.',
  },
]

const CHECKLIST = [
  'Descrição institucional clara e objetiva',
  'Serviços e tecnologias atualizados',
  'Segmentos atendidos (B2B, SaaS, FinTech...)',
  'Ao menos dois cases com resultados mensuráveis',
  'Localização e modalidade de atendimento',
]

const PERGUNTAS = [
  {
    pergunta: 'Preciso ter CNPJ pra me cadastrar?',
    resposta: 'Sim. Hoje o cadastro exige um CNPJ válido (14 dígitos) — é um campo obrigatório no formulário.',
  },
  {
    pergunta: 'O cadastro é pago?',
    resposta: 'Não. O cadastro é gratuito e seu perfil aparece normalmente nas buscas, sem nenhuma cobrança.',
  },
  {
    pergunta: 'Como funciona a recomendação pra empresas?',
    resposta:
      'Quando uma empresa cadastra uma necessidade, comparamos com o que está no seu perfil — serviços, tecnologias e segmentos — e sua startup pode aparecer nas recomendações dela.',
  },
]

export default function ParaStartups() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-brand-100 bg-surface-2">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:py-20">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Sua startup encontrada por quem realmente precisa dela
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">
              Publique um perfil completo, apareça nas buscas por serviços e tecnologias e entre nas
              recomendações de matchmaking das empresas cadastradas.
            </p>

          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          {/* Como funciona (ponto de vista da startup.) */}
          <ol className="grid gap-5 md:grid-cols-3">
            {PASSOS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="rounded-card border border-brand-100 bg-surface p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{texto}</p>
              </li>
            ))}
          </ol>

          {/* Benefícios. */}
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="rounded-card border border-brand-100 bg-surface p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{titulo}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{texto}</p>
              </li>
            ))}
          </ol>

          {/* Checklist + cadastro. */}
          <div className="mt-10 grid gap-8 rounded-card border border-brand-100 bg-surface p-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">Checklist do perfil ideal</h2>
              <p className="mt-2 text-sm text-ink-500">
                Perfis completos aparecem com mais frequência nas recomendações.
              </p>
              <ul className="mt-5 space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <span className="text-ink-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-7 text-white">
              <h3 className="text-xl font-semibold text-white">Cadastro gratuito</h3>
              <p className="mt-3 text-sm text-white/80">
                Leva poucos minutos: dados da startup, serviços, tecnologias, segmentos e cases. Depois
                disso, é só manter atualizado.
              </p>
              <Link
                to="/criar-conta?tipo=startup"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-white/90"
              >
                Cadastrar minha Startup
              </Link>
            </div>
          </div>

          <FAQ />
        </section>
      </main>
      <Footer />
    </>
  )
}

/**
 * Sanfona simples sem lib de UI. (Duplicado por enquanto; se aparecer
 * uma terceira página com FAQ, vale extrair um componente compartilhado.)
 */
function FAQ() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
      <div className="mt-4 divide-y divide-brand-100 border-t border-b border-brand-100">
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
    </div>
  )
}
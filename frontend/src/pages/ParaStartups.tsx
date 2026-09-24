import { CheckIcon, HandshakeIcon, RocketIcon, TrendingUpIcon } from '@/components/icons.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { Link } from 'react-router-dom'

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

export default function ParaStartups() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-brand-100 bg-surface-2">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Sua startup encontrada por quem realmente precisa dela.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">
              Publique um perfil completo, apareça nas buscas por serviços e tecnologias e entre nas
              recomendações de matchmaking das empresas cadastradas.
            </p>
            <Link
              to="/criar-conta?tipo=startup"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Cadastrar minha startup
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <ol className="grid gap-5 md:grid-cols-3">
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
              <h3 className="text-xl font-semibold">Cadastro gratuito</h3>
              <p className="mt-3 text-sm text-white/80">
                Leva poucos minutos: dados da startup, serviços, tecnologias, segmentos e cases. Depois
                disso, é só manter atualizado.
              </p>
              <Link
                to="/criar-conta?tipo=startup"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-white/90"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
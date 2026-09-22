import { ArrowRightIcon } from '@/components/icons.tsx'
import { Link } from 'react-router-dom'

type TipoConta = 'startup' | 'empresa'

type EscolhaTipoProps = {
  onEscolher: (tipo: TipoConta) => void
}

type OpcaoCard = {
  tipo: TipoConta
  titulo: string
  subtitulo: string
  descricao: string
  destaques: string[]
}

const OPCOES: OpcaoCard[] = [
  {
    tipo: 'startup',
    titulo: 'Sou uma Startup',
    subtitulo: 'Quero me conectar a empresas',
    descricao:
      'Cadastre sua startup, apresente suas soluções e seja encontrada pelas empresas certas.',
    destaques: ['Perfil público de visibilidade', 'Match com empresas', 'Receba propostas'],
  },
  {
    tipo: 'empresa',
    titulo: 'Sou uma Empresa',
    subtitulo: 'Quero encontrar startups',
    descricao:
      'Descreva o que a sua empresa precisa e receba recomendações personalizadas de startups.',
    destaques: ['Busca inteligente', 'Matchmaking personalizado', 'Gestão de conexões'],
  },
]

export default function EscolhaTipo({ onEscolher }: EscolhaTipoProps) {
  return (
    <div className="w-full">
      {/* Botão voltar para a home */}
      <div className="mb-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar para a home
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Criar conta
        </h1>
        <p className="mt-3 text-base text-ink-500">
          Como você quer usar o RecInTech?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPCOES.map((opcao) => (
          <div
            key={opcao.tipo}
            className={[
              'group relative flex flex-col rounded-2xl border-2 bg-surface p-6',
              'border-brand-200 shadow-sm transition-all duration-200',
              'hover:border-brand-500 hover:shadow-md hover:-translate-y-0.5',
            ].join(' ')}
          >
            {/* Gradiente de fundo sutil no hover */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-brand-50),transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />

            <div className="relative flex flex-1 flex-col">
              <p className="font-display text-lg font-semibold text-ink-900">{opcao.titulo}</p>
              <p className="mt-0.5 text-sm text-ink-500">{opcao.subtitulo}</p>

              <p className="mt-4 text-sm leading-relaxed text-ink-500">{opcao.descricao}</p>

              <ul className="mt-4 flex flex-col gap-2">
                {opcao.destaques.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-medium text-ink-700">
                    <span className="size-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                id={`tipo-${opcao.tipo}`}
                type="button"
                onClick={() => onEscolher(opcao.tipo)}
                className={[
                  'relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
                  'bg-brand-600 text-sm font-semibold text-white shadow-sm',
                  'transition-all duration-200 hover:bg-brand-700 hover:-translate-y-px hover:shadow-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                Começar
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Já tem conta?{' '}
        <a href="/entrar" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Acessar
        </a>
      </p>
    </div>
  )
}

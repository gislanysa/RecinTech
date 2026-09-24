import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  to: string
  variante?: 'primario' | 'secundario'
  children: ReactNode
}

const CURVA = 'transition-all duration-[450ms] ease-[cubic-bezier(.65,0,.076,1)]'


export default function BotaoCirculo({ to, variante = 'primario', children }: Props) {
  const fundo = variante === 'primario' ? 'bg-brand-600' : 'bg-brand-800'

  return (
    <Link
      to={to}
      className="group relative inline-flex h-10 items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600"
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 h-10 w-10 rounded-full ${fundo} ${CURVA} group-hover:w-full`}
      />
      <span
        aria-hidden="true"
        className={[
          'absolute left-2 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-transparent',
          CURVA,
          'group-hover:translate-x-3 group-hover:bg-white',
          "before:absolute before:-top-[3px] before:right-px before:size-2 before:content-['']",
          'before:rotate-45 before:border-r-2 before:border-t-2 before:border-white',
        ].join(' ')}
      />

      <span
        className={`relative z-10 pl-12 pr-5 text-sm font-semibold text-ink-900 ${CURVA} group-hover:text-white`}
      >
        {children}
      </span>
    </Link>
  )
}

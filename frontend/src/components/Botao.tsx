import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  to: string
  children: ReactNode
}

export default function Botao({ to, children }: Props) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex items-center rounded-full bg-surface px-6 py-2.5',
        'text-sm font-medium tracking-[0.5px] text-ink-900',
        'shadow-[0_0_8px_rgb(0_0_0/0.05)]',
        'transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
        'hover:bg-brand-600 hover:text-white',
        'hover:shadow-[0_6px_18px_-6px_var(--color-brand-600)]',
        'active:translate-y-1 active:bg-brand-600 active:text-white',
        'active:shadow-none active:duration-100',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

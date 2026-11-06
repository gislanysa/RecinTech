import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  children: ReactNode
  /** Com `to` vira link de navegação; sem `to`, vira `<button>` de formulário. */
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  /** Ocupa a largura toda e centraliza — é como os formulários usam. */
  bloco?: boolean
  id?: string
}

/**
 * Botão padrão do site: branco em repouso, azul da marca no hover, com um
 * brilho discreto embaixo. No clique afunda e perde o brilho, numa transição
 * bem mais curta.
 */
const ESTILO = [
  // o anel é o que sinaliza "isto é um botão" mesmo sobre fundo claro
  'inline-flex items-center gap-2 rounded-full bg-brand-100 px-6 py-2.5 ring-1 ring-brand-200',
  'text-sm font-medium tracking-[0.5px] text-ink-900',
  'shadow-[0_0_8px_rgb(0_0_0/0.05)]',
  'transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
  'hover:bg-brand-600 hover:text-white hover:ring-brand-600',
  'hover:shadow-[0_3px_10px_-5px_var(--color-brand-600)]',
  'active:translate-y-1 active:bg-brand-600 active:text-white',
  'active:shadow-none active:duration-100',
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
].join(' ')

export default function Botao({
  children,
  to,
  type = 'button',
  disabled,
  onClick,
  bloco,
  id,
}: Props) {
  const classe = bloco ? `${ESTILO} w-full justify-center` : ESTILO

  if (to) {
    return (
      <Link id={id} to={to} className={classe}>
        {children}
      </Link>
    )
  }

  return (
    <button id={id} type={type} disabled={disabled} onClick={onClick} className={classe}>
      {children}
    </button>
  )
}

import { ArrowLeftIcon } from '@/components/icons.tsx'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type BotaoVoltarProps = {
  /** Se informado, navega usando Link (ex.: to="/") */
  to?: string
  /** Se informado, executa ação ao clicar (ex.: onVoltar) */
  onClick?: () => void
  /** Texto do botão. Padrão: "Voltar" */
  children?: ReactNode
  className?: string
}

/**
 * Botão ou link de retorno padronizado com seta para a esquerda.
 *
 * Se receber a prop `to`, renderiza um `<Link>` do react-router-dom;
 * caso contrário, renderiza um `<button type="button">`.
 */
export default function BotaoVoltar({
  to,
  onClick,
  children = 'Voltar',
  className = '',
}: BotaoVoltarProps) {
  const estilo = `inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600 ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={estilo}>
        <ArrowLeftIcon className="size-4" />
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={estilo}>
      <ArrowLeftIcon className="size-4" />
      {children}
    </button>
  )
}

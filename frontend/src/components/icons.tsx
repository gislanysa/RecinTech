import type { SVGProps } from 'react'

/**
 * Ícones em SVG inline.
 *
 * O README fixa a stack do front em React, Vite, TypeScript, Tailwind e Axios —
 * então nada de biblioteca de ícones. Todos herdam `currentColor` e o tamanho
 * vem das classes do Tailwind (ex.: `className="size-5"`).
 */
type IconProps = SVGProps<SVGSVGElement>

const stroke = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function SearchIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
      <path d="M18.5 3.5v3M20 5h-3" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

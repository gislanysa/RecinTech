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

export function RocketIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m3.5 11.5 9-9a3 3 0 0 1 3 3l-9 9" />
      <path d="M15.5 3.5a6 6 0 0 1 5 5" />
      <path d="M9 11.5 13 15.5" />
      <path d="m14.5 19.5 3-3" />
      <path d="m4.5 9.5 3-3" />
    </svg>
  )
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

export function HandshakeIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2" />
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
      <path d="M3 4h8" />
    </svg>
  )
}

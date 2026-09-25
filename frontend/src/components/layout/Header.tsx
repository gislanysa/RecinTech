import Botao from '@/components/Botao.tsx'
import { CloseIcon, MenuIcon } from '@/components/icons.tsx'
import Logo from '@/components/Logo.tsx'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Explorar startups', to: '/startups' },
  { label: 'Como funciona', to: '/como-funciona' },
  { label: 'Para startups', to: '/para-startups' },
]

type HeaderProps = {
  /**
   * `true` na home, que abre com uma faixa de fundo própria. O cabeçalho se
   * funde a ela no topo e só ganha fundo branco ao rolar.
   */
  overlay?: boolean
}

export default function Header({ overlay = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!overlay) return
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overlay])

  // Transparente só enquanto está sobreposto ao topo da home e o menu está fechado.
  const transparent = overlay && !scrolled && !menuOpen

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-colors duration-300',
        transparent
          ? 'border-b border-transparent bg-transparent text-ink-700'
          : 'border-b border-brand-100 bg-surface/85 text-ink-700 backdrop-blur-xl',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-ink-500 hover:text-brand-700',
              ].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* O span existe só para esconder o "Acessar" no mobile sem brigar com o
              display do próprio botão. */}
          <span className="hidden sm:block">
            <Botao to="/entrar">
              Acessar
            </Botao>
          </span>
          <Botao to="/criar-conta">Criar conta</Botao>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="-mr-1 rounded-lg p-2 md:hidden"
          >
            {menuOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-brand-100 bg-surface px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm font-medium text-ink-700"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/entrar"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-2 py-2.5 text-sm font-medium text-ink-700 sm:hidden"
          >
            Acessar
          </Link>
        </nav>
      )}
    </header>
  )
}


import Logo from '@/components/Logo.tsx'
import {
  CloseIcon,
  GridIcon,
  HandshakeIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  RocketIcon,
  TargetIcon,
} from '@/components/icons.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { useAuth } from '@/contexts/useAuth.ts'
import type { Company } from '@/lib/api.ts'
import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'

type ItemDeNavegacao = {
  rotulo: string
  to: string
  Icone: ComponentType<SVGProps<SVGSVGElement>>
  /** Só fica ativo na rota exata (necessário no Dashboard, que é prefixo das outras). */
  exato?: boolean
}

const ITENS: ItemDeNavegacao[] = [
  { rotulo: 'Dashboard', to: '/dashboard/empresa', Icone: HomeIcon, exato: true },
  { rotulo: 'Minhas demandas', to: '/dashboard/empresa/demandas', Icone: TargetIcon },
  { rotulo: 'Recomendações', to: '/dashboard/empresa/recomendacoes', Icone: RocketIcon },
  { rotulo: 'Conexões', to: '/dashboard/empresa/conexoes', Icone: HandshakeIcon },
  { rotulo: 'Catálogo', to: '/startups', Icone: GridIcon },
]

function classeDoItem(ativo: boolean): string {
  return [
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600',
    ativo
      ? 'bg-brand-100 text-brand-800'
      : 'text-ink-700 hover:bg-brand-50 hover:text-brand-700',
  ].join(' ')
}

function ConteudoDaSidebar({
  nomeDaEmpresa,
  aoNavegar,
}: {
  nomeDaEmpresa: string
  aoNavegar?: () => void
}) {
  const navigate = useNavigate()
  const { logout: encerrarSessao } = useAuth()
  const [saindo, setSaindo] = useState(false)

  async function handleSair() {
    if (saindo) return
    setSaindo(true)
    try {
      await encerrarSessao()
    } finally {
      navigate('/entrar', { replace: true })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Informações da empresa na sidebar — sem a logo da Recintech */}
      <div className="border-b border-brand-100 px-5 py-5 pr-12">
        <p
          className="truncate font-display text-base font-semibold text-ink-900"
          title={nomeDaEmpresa}
        >
          {nomeDaEmpresa}
        </p>
        <p className="mt-0.5 text-xs text-ink-500">Conta empresarial</p>
      </div>

      <nav aria-label="Navegação da empresa" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {ITENS.map(({ rotulo, to, Icone, exato }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exato}
                onClick={aoNavegar}
                className={({ isActive }) => classeDoItem(isActive)}
              >
                {({ isActive }) => (
                  <>
                    {/* Barra lateral: indicador visual da página atual */}
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-600 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      ].join(' ')}
                    />
                    <Icone className="size-5 shrink-0" />
                    <span className="truncate">{rotulo}</span>
                    {isActive && <span className="sr-only"> (página atual)</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botão Sair na parte inferior da sidebar */}
      <div className="border-t border-brand-100 p-3">
        <button
          id="btn-sair-sidebar-empresa"
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-accent-100 hover:text-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOutIcon className="size-5 shrink-0" />
          {saindo ? 'Saindo…' : 'Sair'}
        </button>
      </div>
    </div>
  )
}

/**
 * Layout das telas da empresa autenticada:
 * - Topbar fixa no topo contendo a logo da Recintech
 * - Sidebar fixa à esquerda (desktop)
 * - Gaveta móvel (menu hambúrguer) em tablets e celulares
 */
export default function LayoutDashboardEmpresa() {
  const contexto = useOutletContext<ContextoSessao>()
  const empresa = contexto.conta as Company
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMenuAberto(false)
  }

  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <div className="min-h-screen bg-canvas">
      {/* Topbar da aplicação com a logo da Recintech */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-100 bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            id="btn-abrir-menu-empresa"
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-mobile-empresa"
            className="grid size-10 place-items-center rounded-lg text-ink-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 lg:hidden"
          >
            <MenuIcon className="size-6" />
          </button>
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-accent-200">
            Empresa
          </span>
        </div>
      </header>

      {/* Sidebar fixa desktop */}
      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-64 border-r border-brand-100 bg-surface lg:block">
        <ConteudoDaSidebar nomeDaEmpresa={empresa.name} />
      </aside>

      {/* Gaveta responsiva tablet/celular */}
      <div
        className={[
          'fixed inset-0 z-50 transition-[visibility] duration-0 lg:hidden',
          menuAberto ? 'visible' : 'invisible pointer-events-none delay-300',
        ].join(' ')}
        aria-hidden={!menuAberto}
      >
        <div
          onClick={() => setMenuAberto(false)}
          className={[
            'absolute inset-0 bg-ink-900/40 transition-opacity duration-300',
            menuAberto ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />
        <aside
          id="menu-mobile-empresa"
          className={[
            'absolute inset-y-0 left-0 w-72 max-w-[85%] bg-surface shadow-xl transition-transform duration-300',
            menuAberto ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-accent-600"
          >
            <CloseIcon className="size-5" />
          </button>
          <ConteudoDaSidebar
            nomeDaEmpresa={empresa.name}
            aoNavegar={() => setMenuAberto(false)}
          />
        </aside>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet context={contexto} />
        </div>
      </main>
    </div>
  )
}

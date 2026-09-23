import Logo from '@/components/Logo.tsx'
import { Link } from 'react-router-dom'

/**
 * Dashboard da startup — exibido após o cadastro.
 */
export default function DashboardStartup() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo />
          </Link>

          <div className="ml-auto">
            <Link
              to="/"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Dashboard da Startup</p>
          <p className="mt-2 text-sm text-ink-500">Em breve, o conteúdo estará disponível aqui.</p>
        </div>
      </main>
    </div>
  )
}

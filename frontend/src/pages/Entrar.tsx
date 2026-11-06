import FormularioLogin from '@/components/login/FormularioLogin.tsx'
import Logo from '@/components/Logo.tsx'
import { Link } from 'react-router-dom'

export default function Entrar() {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {/* Gradientes de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_55%_at_15%_0%,var(--color-brand-100),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 right-0 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--color-accent-100),transparent_65%)] opacity-70 blur-3xl"
      />

      {/* Cabeçalho simples */}
      <header className="relative z-10 flex h-16 items-center border-b border-brand-100 bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Voltar para a home">
          <Logo />
        </Link>

        <div className="ml-auto text-sm text-ink-500">
          Novo por aqui?{' '}
          <Link
            to="/criar-conta"
            className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </header>

      {/* Conteúdo central */}
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-brand-100 bg-surface/90 p-6 shadow-xl shadow-ink-900/5 backdrop-blur-sm sm:p-10">
          <FormularioLogin />
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} RecInTech. Todos os direitos reservados.
      </footer>
    </div>
  )
}

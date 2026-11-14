import Botao from '@/components/Botao.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { Link } from 'react-router-dom'

export default function PaginaNaoEncontrada() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <main
        role="main"
        className="relative flex flex-1 items-center justify-center px-4 py-16 sm:py-24"
      >
        {/* Efeito de brilho de fundo suave */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        >
          <div className="h-[28rem] w-[28rem] rounded-full bg-brand-100/40 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          {/* Badge 404 */}
          <span className="inline-flex items-center rounded-full bg-brand-100 px-3.5 py-1 text-xs font-semibold tracking-wider text-brand-800 ring-1 ring-brand-200">
            ERRO 404
          </span>

          <span
            aria-hidden="true"
            className="mt-4 font-display text-7xl font-extrabold tracking-tight text-brand-900/10 sm:text-9xl select-none"
          >
            404
          </span>

          <h1 className="-mt-8 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Página não encontrada
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
            O endereço que você tentou acessar não existe, foi removido ou está temporariamente
            indisponível. Verifique a URL digitada ou navegue pelos atalhos abaixo.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Botao to="/">Voltar para o início</Botao>
            <Link
              to="/startups"
              className="inline-flex items-center justify-center rounded-full border border-ink-200 bg-surface px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              Explorar startups
            </Link>
          </div>

          <div className="mt-10 border-t border-brand-100 pt-6 text-xs text-ink-500">
            Precisa de ajuda ou encontrou um erro?{' '}
            <Link to="/entrar" className="font-medium text-brand-600 hover:underline">
              Acesse sua conta
            </Link>{' '}
            ou retorne à página principal.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

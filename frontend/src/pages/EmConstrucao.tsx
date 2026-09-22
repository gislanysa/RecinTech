import Header from '@/components/layout/Header.tsx'
import { Link } from 'react-router-dom'

/**
 * Marcador temporário para as telas que ainda não existem.
 *
 * Só serve para os links da home não caírem no vazio enquanto as outras telas
 * são feitas em suas próprias branches — quem assumir a tela troca esta rota
 * pelo componente de verdade em `App.tsx`.
 */
export default function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">{titulo}</h1>
        <p className="mt-3 text-ink-500">Esta tela está sendo construída em outra branch.</p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Voltar para a home
        </Link>
      </main>
    </>
  )
}

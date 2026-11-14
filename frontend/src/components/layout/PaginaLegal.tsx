import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'
import { DATA_DA_POLITICA, VERSAO_DA_POLITICA } from '@/lib/politica.ts'
import type { ReactNode } from 'react'

/**
 * Invólucro das páginas legais, política de privacidade e termos de uso.
 *
 * Segue a estética das páginas de conteúdo do site, com uma diferença
 * deliberada: o título não usa a animação de máquina de escrever. Ela combina
 * com as páginas de apresentação e destoaria de um documento que a pessoa
 * abre para ler com atenção.
 *
 * A largura é menor que a das outras páginas porque aqui o conteúdo é texto
 * corrido, e linha longa demais cansa a leitura.
 */
export default function PaginaLegal({
  titulo,
  resumo,
  children,
}: {
  titulo: string
  /** Uma frase dizendo do que trata o documento, em linguagem direta. */
  resumo: string
  children: ReactNode
}) {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-brand-100 bg-surface-2">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{titulo}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-500">{resumo}</p>
            <p className="mt-6 text-sm text-ink-500">
              Versão {VERSAO_DA_POLITICA}, em vigor desde {DATA_DA_POLITICA}.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-10">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  )
}

/** Uma seção numerada do documento. */
export function SecaoLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-ink-700">{children}</div>
    </section>
  )
}

/** Destaque para o que o leitor precisa notar, mesmo lendo na diagonal. */
export function Destaque({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-accent-300 bg-accent-100 px-5 py-4 text-sm leading-relaxed text-ink-700">
      {children}
    </div>
  )
}

/** Lista de itens do documento, por exemplo os dados coletados. */
export function ListaLegal({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

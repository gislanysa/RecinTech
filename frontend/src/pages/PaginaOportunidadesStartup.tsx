import PainelOportunidades from '@/components/dashboard-startup/PainelOportunidades.tsx'

/**
 * Página "Oportunidades" da sidebar.
 *
 * O dashboard mostra o mesmo painel como resumo; aqui ele é o assunto da
 * tela. Antes esta rota caía em "Em breve", o que entregava menos do que a
 * própria home já mostrava.
 */
export default function PaginaOportunidadesStartup() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Oportunidades
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Demandas de empresas compatíveis com as tecnologias, serviços e especialidades do seu perfil.
        </p>
      </header>

      <PainelOportunidades />
    </div>
  )
}

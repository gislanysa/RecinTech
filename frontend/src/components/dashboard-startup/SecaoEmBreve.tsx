import Botao from '@/components/Botao.tsx'

/**
 * Marcador das seções da sidebar que ainda não têm tela (Meu perfil,
 * Oportunidades, Conexões, Plano). Diferente de `EmConstrucao`, fica DENTRO
 * do layout do dashboard, mantendo a sidebar visível.
 */
export default function SecaoEmBreve({ titulo }: { titulo: string }) {
  return (
    <section className="rounded-card border border-dashed border-brand-200 bg-surface px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-ink-900">{titulo}</h1>
      <p className="mt-2 text-sm text-ink-500">Esta seção ainda está em construção.</p>
      <div className="mt-6 flex justify-center">
        <Botao to="/dashboard/startup">Voltar ao dashboard</Botao>
      </div>
    </section>
  )
}

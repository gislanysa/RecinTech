import { EyeIcon, SearchIcon, TrendingUpIcon } from '@/components/icons.tsx'
import type { SVGProps } from 'react'

/**
 * "Visibilidade": quantas empresas viram o perfil, em quantas buscas ele
 * apareceu, quantos cliques em contato.
 *
 * O backend NÃO REGISTRA nada disso: não existe contagem de visualização, de
 * aparição em busca nem de clique em nenhum lugar do banco. Por isso os
 * números ficam zerados com a razão escrita, em vez de números de exemplo.
 *
 * Métrica inventada sobre o próprio perfil é diferente de empresa de exemplo:
 * a pessoa leria "128 visualizações" como um fato sobre ela, e não é.
 */
export default function PainelVisibilidade() {
  return (
    <section
      aria-labelledby="titulo-visibilidade"
      className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2 id="titulo-visibilidade" className="text-lg font-semibold">
        Visibilidade
      </h2>
      <p className="mt-1 text-sm text-ink-500">Como as empresas estão encontrando você.</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metrica Icone={EyeIcon} rotulo="Visualizações do perfil" />
        <Metrica Icone={SearchIcon} rotulo="Aparições em buscas" />
        <Metrica Icone={TrendingUpIcon} rotulo="Cliques em contato" />
      </dl>

      <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-xs text-ink-500">
        A plataforma ainda não registra essas medições. Assim que o servidor passar a contá-las, seus
        números aparecem aqui.
      </p>
    </section>
  )
}

function Metrica({
  Icone,
  rotulo,
}: {
  Icone: (props: SVGProps<SVGSVGElement>) => React.ReactElement
  rotulo: string
}) {
  return (
    <div className="rounded-xl border border-brand-100 bg-surface-2 p-4">
      <Icone className="size-4 text-ink-500" />
      <dd className="mt-2 font-display text-2xl font-bold text-ink-500">0</dd>
      <dt className="mt-0.5 text-xs text-ink-500">{rotulo}</dt>
    </div>
  )
}

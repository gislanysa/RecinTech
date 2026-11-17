import PainelOportunidades from '@/components/dashboard-startup/PainelOportunidades.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Startup } from '@/lib/api.ts'
import type { Tags } from '@/lib/perfil.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

/**
 * Página "Oportunidades" da sidebar.
 *
 * Apresenta as demandas reais cadastradas pelas empresas recomendadas para a startup.
 */
export default function PaginaOportunidadesStartup() {
  const contexto = useOutletContext<ContextoSessao | undefined>()
  const startup = contexto?.conta as Startup | undefined
  const [tags, setTags] = useState<Tags | null>(null)

  useEffect(() => {
    if (startup?.id) {
      void carregarTagsDaStartup(startup.id).then(setTags)
    }
  }, [startup?.id])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Oportunidades recomendadas para sua startup
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Baseadas nas tecnologias, serviços e especialidades que você cadastrou no seu perfil.
        </p>
      </header>

      <PainelOportunidades comCabecalho={false} startupId={startup?.id} tags={tags} />
    </div>
  )
}

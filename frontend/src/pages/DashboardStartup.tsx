import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import PainelOportunidades from '@/components/dashboard-startup/PainelOportunidades.tsx'
import PainelSaudePerfil from '@/components/dashboard-startup/PainelSaudePerfil.tsx'
import type { Startup } from '@/lib/api.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'
import type { Tags } from '@/lib/perfil.ts'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

/**
 * Dashboard da startup. Renderizada dentro de `LayoutDashboardStartup`
 * (sidebar) e de `RotaProtegida` (sessão + tipo de conta).
 */
export default function DashboardStartup() {
  const { conta } = useOutletContext<ContextoSessao>()
  const startup = conta as Startup
  const [tags, setTags] = useState<Tags | null>(null)

  useEffect(() => {
    // Cada rota de tag que falhar vira lista vazia (ver carregarTagsDaStartup).
    void carregarTagsDaStartup(startup.id).then(setTags)
  }, [startup.id])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Olá, {startup.name}!
        </h1>
        <p className="mt-1 text-sm text-ink-500">Acompanhe seu perfil e descubra novas oportunidades.</p>
      </header>

      <PainelSaudePerfil startup={startup} tags={tags} />
      <PainelOportunidades />
    </div>
  )
}

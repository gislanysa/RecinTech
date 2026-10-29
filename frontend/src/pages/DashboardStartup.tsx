import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import PainelConexoesResumo from '@/components/dashboard-startup/PainelConexoesResumo.tsx'
import PainelNotificacoes from '@/components/dashboard-startup/PainelNotificacoes.tsx'
import PainelOportunidades from '@/components/dashboard-startup/PainelOportunidades.tsx'
import PainelPlano from '@/components/dashboard-startup/PainelPlano.tsx'
import PainelSaudePerfil from '@/components/dashboard-startup/PainelSaudePerfil.tsx'
import PainelVisibilidade from '@/components/dashboard-startup/PainelVisibilidade.tsx'
import type { Startup } from '@/lib/api.ts'
import { listarConexoes, type Conexao } from '@/lib/oportunidades.ts'
import { ehPremium } from '@/lib/planos.ts'
import type { Tags } from '@/lib/perfil.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

/**
 * Dashboard da startup: a primeira tela depois do login.
 *
 * Renderizada dentro de `LayoutDashboardStartup` (sidebar) e de
 * `RotaProtegida` (sessão + tipo de conta).
 *
 * As conexões são buscadas aqui, uma vez, e repassadas aos painéis que
 * precisam delas. As notificações saem dessas mesmas conexões, em vez de uma
 * fonte própria que não existe no backend.
 */
export default function DashboardStartup() {
  const { conta } = useOutletContext<ContextoSessao>()
  const startup = conta as Startup
  const [tags, setTags] = useState<Tags | null>(null)
  const [conexoes, setConexoes] = useState<Conexao[] | null>(null)

  useEffect(() => {
    // Cada rota de tag que falhar vira lista vazia (ver carregarTagsDaStartup).
    void carregarTagsDaStartup(startup.id).then(setTags)
  }, [startup.id])

  useEffect(() => {
    let ativo = true
    listarConexoes()
      .then(({ conexoes }) => {
        if (ativo) setConexoes(conexoes)
      })
      .catch(() => {
        if (ativo) setConexoes([])
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Olá, {startup.name}
        </h1>
        {/* Sem a localização: ela já aparece no perfil, e aqui só competia
            com o cumprimento. O tipo de conta saiu daqui também, porque a
            etiqueta da sidebar passou a dizer isso. */}
        {tags?.area && <p className="mt-1 truncate text-sm text-ink-500">{tags.area}</p>}
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <PainelSaudePerfil startup={startup} tags={tags} />
          {/* Duas no dashboard; o resto fica na página de Oportunidades. */}
          <PainelOportunidades limite={2} />
          <PainelConexoesResumo conexoes={conexoes} />
          {/* Visibilidade é benefício do plano premium ("Relatório de
              visualizações"), então só aparece para quem assina. */}
          {ehPremium() && <PainelVisibilidade />}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
          <PainelNotificacoes conexoes={conexoes} />
          <PainelPlano />
        </aside>
      </div>
    </div>
  )
}

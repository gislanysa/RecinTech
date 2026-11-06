import ModalNovaDemanda from '@/components/dashboard-empresa/ModalNovaDemanda.tsx'
import ModalPerfilStartup from '@/components/dashboard-empresa/ModalPerfilStartup.tsx'
import PainelRecomendacoes from '@/components/dashboard-empresa/PainelRecomendacoes.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Company } from '@/lib/api.ts'
import { calcularRecomendacoes, listarDemandas, type Demanda } from '@/lib/demandas.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

export default function PaginaRecomendacoesEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresa = conta as Company

  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [carregandoDemandas, setCarregandoDemandas] = useState(true)
  const [startups, setStartups] = useState<StartupCatalogo[]>([])
  const [carregandoStartups, setCarregandoStartups] = useState(true)

  const [demandaFiltroId, setDemandaFiltroId] = useState<string | undefined>()
  const [modalNovaDemanda, setModalNovaDemanda] = useState(false)
  const [startupModal, setStartupModal] = useState<StartupCatalogo | null>(null)
  const [demandaSugeridaParaModal, setDemandaSugeridaParaModal] = useState<string | undefined>()

  useEffect(() => {
    listarDemandas(empresa.id)
      .then(setDemandas)
      .finally(() => setCarregandoDemandas(false))

    listarStartups({ limit: 50, offset: 0 })
      .then(setStartups)
      .finally(() => setCarregandoStartups(false))
  }, [empresa.id])

  const recomendacoes = useMemo(() => {
    return calcularRecomendacoes(demandas, startups, demandaFiltroId)
  }, [demandas, startups, demandaFiltroId])

  function handleAbrirPerfil(startup: StartupCatalogo, demandaId?: string) {
    setStartupModal(startup)
    setDemandaSugeridaParaModal(demandaId)
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Startups recomendadas
        </h1>
        <p className="text-sm text-ink-500">
          Visualize startups com tecnologias, segmentos e serviços compatíveis com as demandas da sua empresa.
        </p>
      </header>

      <PainelRecomendacoes
        recomendacoes={recomendacoes}
        demandas={demandas}
        demandaAtivaId={demandaFiltroId}
        carregando={carregandoStartups || carregandoDemandas}
        onSelecionarDemandaFiltro={setDemandaFiltroId}
        onVerPerfil={handleAbrirPerfil}
      />

      <ModalNovaDemanda
        aberto={modalNovaDemanda}
        companyId={empresa.id}
        aoFechar={() => setModalNovaDemanda(false)}
        aoCriar={(nova) => {
          setDemandas((prev) => [nova, ...prev])
        }}
      />

      <ModalPerfilStartup
        startup={startupModal}
        demandas={demandas}
        demandaSugeridaId={demandaSugeridaParaModal}
        companyId={empresa.id}
        aoFechar={() => setStartupModal(null)}
      />
    </div>
  )
}

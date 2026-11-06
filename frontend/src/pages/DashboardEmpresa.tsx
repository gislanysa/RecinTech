import ModalNovaDemanda from '@/components/dashboard-empresa/ModalNovaDemanda.tsx'
import ModalPerfilStartup from '@/components/dashboard-empresa/ModalPerfilStartup.tsx'
import PainelDemandas from '@/components/dashboard-empresa/PainelDemandas.tsx'
import PainelRecomendacoes from '@/components/dashboard-empresa/PainelRecomendacoes.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Company } from '@/lib/api.ts'
import {
  calcularRecomendacoes,
  listarDemandas,
  type Demanda,
} from '@/lib/demandas.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

/**
 * Dashboard da Empresa — Página inicial / Visão geral.
 *
 * Renderizada dentro de `LayoutDashboardEmpresa` (sidebar + topbar com logo Recintech)
 * e protegida por `RotaProtegida` com tipo="company".
 */
export default function DashboardEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresa = conta as Company

  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [carregandoDemandas, setCarregandoDemandas] = useState(true)
  const [erroDemandas, setErroDemandas] = useState<string | null>(null)

  const [startups, setStartups] = useState<StartupCatalogo[]>([])
  const [carregandoStartups, setCarregandoStartups] = useState(true)

  const [demandaFiltroId, setDemandaFiltroId] = useState<string | undefined>()
  const [modalNovaDemanda, setModalNovaDemanda] = useState(false)
  const [demandaEmEdicao, setDemandaEmEdicao] = useState<Demanda | null>(null)
  const [startupModal, setStartupModal] = useState<StartupCatalogo | null>(null)
  const [demandaSugeridaParaModal, setDemandaSugeridaParaModal] = useState<string | undefined>()

  useEffect(() => {
    let ativo = true
    listarDemandas(empresa.id)
      .then((lista) => {
        if (ativo) setDemandas(lista)
      })
      .catch(() => {
        if (ativo) setErroDemandas('Não foi possível carregar as demandas da empresa.')
      })
      .finally(() => {
        if (ativo) setCarregandoDemandas(false)
      })

    listarStartups({ limit: 50, offset: 0 }).then((dados) => {
      if (ativo) {
        setStartups(dados)
        setCarregandoStartups(false)
      }
    })

    return () => {
      ativo = false
    }
  }, [empresa.id])

  async function handleRecarregar() {
    setCarregandoDemandas(true)
    setErroDemandas(null)
    try {
      const lista = await listarDemandas(empresa.id)
      setDemandas(lista)
    } catch {
      setErroDemandas('Não foi possível carregar as demandas da empresa.')
    } finally {
      setCarregandoDemandas(false)
    }
  }

  // Contagem de recomendações para cada demanda da empresa
  const contagemPorDemanda = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const d of demandas) {
      mapa[d.id] = calcularRecomendacoes([d], startups).length
    }
    return mapa
  }, [demandas, startups])

  // Startups recomendadas com base nas demandas atuais e filtro ativo
  const recomendacoes = useMemo(() => {
    return calcularRecomendacoes(demandas, startups, demandaFiltroId)
  }, [demandas, startups, demandaFiltroId])

  function handleAbrirPerfil(startup: StartupCatalogo, demandaId?: string) {
    setStartupModal(startup)
    setDemandaSugeridaParaModal(demandaId)
  }

  return (
    <div className="flex flex-col gap-10">
      {/* 2. Cabeçalho de boas-vindas com dados dinâmicos da empresa */}
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Olá, {empresa.name}!
        </h1>
        <p className="text-sm text-ink-500">
          Gerencie suas demandas tecnológicas e encontre startups recomendadas para o seu negócio.
        </p>
      </header>

      {/* 3. Painel de demandas da empresa */}
      <PainelDemandas
        demandas={demandas}
        carregando={carregandoDemandas}
        erro={erroDemandas}
        demandaAtivaId={demandaFiltroId}
        contagemRecomendacoesPorDemanda={contagemPorDemanda}
        onNovaDemanda={() => {
          setDemandaEmEdicao(null)
          setModalNovaDemanda(true)
        }}
        onEditarDemanda={(demanda) => {
          setDemandaEmEdicao(demanda)
          setModalNovaDemanda(true)
        }}
        onSelecionarDemanda={(id) => {
          setDemandaFiltroId((atual) => (atual === id ? undefined : id))
        }}
        onTentarNovamente={handleRecarregar}
      />

      {/* 4. Painel de startups recomendadas */}
      <PainelRecomendacoes
        recomendacoes={recomendacoes}
        demandas={demandas}
        demandaAtivaId={demandaFiltroId}
        carregando={carregandoStartups || carregandoDemandas}
        onSelecionarDemandaFiltro={setDemandaFiltroId}
        onVerPerfil={handleAbrirPerfil}
      />

      {/* Modal para cadastrar ou editar demanda */}
      <ModalNovaDemanda
        aberto={modalNovaDemanda}
        companyId={empresa.id}
        demandaParaEditar={demandaEmEdicao}
        aoFechar={() => {
          setModalNovaDemanda(false)
          setDemandaEmEdicao(null)
        }}
        aoSalvar={(salva) => {
          setDemandas((prev) => {
            const index = prev.findIndex((d) => d.id === salva.id)
            if (index >= 0) {
              const copia = [...prev]
              copia[index] = salva
              return copia
            }
            return [salva, ...prev]
          })
        }}
      />

      {/* 5. Modal / Card ampliado com perfil detalhado da startup */}
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

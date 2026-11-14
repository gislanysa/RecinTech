import ModalNovaDemanda from '@/components/dashboard-empresa/ModalNovaDemanda.tsx'
import PainelDemandas from '@/components/dashboard-empresa/PainelDemandas.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { useDemandas } from '@/hooks/useDemandas.ts'
import type { Company } from '@/lib/api.ts'
import { calcularRecomendacoes, type Demanda } from '@/lib/demandas.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

const DEMANDAS_POR_PAGINA = 10

export default function PaginaDemandasEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresa = conta as Company
  const navigate = useNavigate()

  const {
    demandas,
    carregando,
    erro,
    pagina,
    proximaPagina,
    paginaAnterior,
    temProximaPagina,
    temPaginaAnterior,
    recarregar,
    salvarDemandaLocal,
  } = useDemandas({
    companyId: empresa?.id,
    porPagina: DEMANDAS_POR_PAGINA,
  })

  const [startups, setStartups] = useState<StartupCatalogo[]>([])
  const [modalNovaDemanda, setModalNovaDemanda] = useState(false)
  const [demandaEmEdicao, setDemandaEmEdicao] = useState<Demanda | null>(null)

  useEffect(() => {
    let ativo = true
    listarStartups({
      limit: 50,
      offset: 0,
      aoAtualizar: (atualizada) => {
        if (!ativo) return
        setStartups((prev) =>
          prev.map((s) => (s.id === atualizada.id ? atualizada : s)),
        )
      },
    }).then((dados) => {
      if (ativo) setStartups(dados)
    })

    return () => {
      ativo = false
    }
  }, [])

  const contagemPorDemanda = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const d of demandas) {
      mapa[d.id] = calcularRecomendacoes([d], startups).length
    }
    return mapa
  }, [demandas, startups])

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Minhas demandas tecnológicas
        </h1>
        <p className="text-sm text-ink-500">
          Acompanhe, cadastre e gerencie todas as demandas e necessidades da sua empresa.
        </p>
      </header>

      <PainelDemandas
        modo="pagina"
        demandas={demandas}
        carregando={carregando}
        erro={erro}
        contagemRecomendacoesPorDemanda={contagemPorDemanda}
        onNovaDemanda={() => {
          setDemandaEmEdicao(null)
          setModalNovaDemanda(true)
        }}
        onEditarDemanda={(demanda) => {
          setDemandaEmEdicao(demanda)
          setModalNovaDemanda(true)
        }}
        onSelecionarDemanda={() => {
          navigate('/dashboard/empresa/recomendacoes')
        }}
        onTentarNovamente={recarregar}
      />

      {/* Paginação com proteção contra página vazia */}
      <nav
        aria-label="Paginação das demandas"
        className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm"
      >
        <button
          type="button"
          onClick={paginaAnterior}
          disabled={!temPaginaAnterior || carregando}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm font-medium text-ink-600">
          Página {pagina + 1}
        </span>
        <button
          type="button"
          onClick={proximaPagina}
          disabled={!temProximaPagina || carregando}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </nav>

      <ModalNovaDemanda
        aberto={modalNovaDemanda}
        companyId={empresa.id}
        demandaParaEditar={demandaEmEdicao}
        aoFechar={() => {
          setModalNovaDemanda(false)
          setDemandaEmEdicao(null)
        }}
        aoSalvar={salvarDemandaLocal}
      />
    </div>
  )
}

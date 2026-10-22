import ModalNovaDemanda from '@/components/dashboard-empresa/ModalNovaDemanda.tsx'
import PainelDemandas from '@/components/dashboard-empresa/PainelDemandas.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Company } from '@/lib/api.ts'
import { calcularRecomendacoes, listarDemandas, type Demanda } from '@/lib/demandas.ts'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

export default function PaginaDemandasEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresa = conta as Company
  const navigate = useNavigate()

  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [startups, setStartups] = useState<StartupCatalogo[]>([])
  const [modalNovaDemanda, setModalNovaDemanda] = useState(false)
  const [demandaEmEdicao, setDemandaEmEdicao] = useState<Demanda | null>(null)

  useEffect(() => {
    let ativo = true
    listarDemandas(empresa.id)
      .then((lista) => {
        if (ativo) setDemandas(lista)
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar as demandas da empresa.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    listarStartups({ limit: 50, offset: 0 }).then((dados) => {
      if (ativo) setStartups(dados)
    })

    return () => {
      ativo = false
    }
  }, [empresa.id])

  async function handleRecarregar() {
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarDemandas(empresa.id)
      setDemandas(lista)
    } catch {
      setErro('Não foi possível carregar as demandas da empresa.')
    } finally {
      setCarregando(false)
    }
  }

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
        onTentarNovamente={handleRecarregar}
      />

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
    </div>
  )
}

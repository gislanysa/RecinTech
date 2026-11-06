import PainelConexoes from '@/components/dashboard-empresa/PainelConexoes.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Company } from '@/lib/api.ts'
import { listarConvites, type ConviteReuniao } from '@/lib/demandas.ts'
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

export default function PaginaConexoesEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresa = conta as Company
  const navigate = useNavigate()

  const [convites, setConvites] = useState<ConviteReuniao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarConvites(empresa.id)
      .then(setConvites)
      .finally(() => setCarregando(false))
  }, [empresa.id])

  return (
    <div className="flex flex-col gap-8">
      <PainelConexoes
        convites={convites}
        carregando={carregando}
        onExplorarRecomendacoes={() => {
          navigate('/dashboard/empresa/recomendacoes')
        }}
      />
    </div>
  )
}

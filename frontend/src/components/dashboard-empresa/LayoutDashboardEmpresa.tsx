import LayoutDashboardBase, {
  type ItemNavegacaoDashboard,
} from '@/components/layout/LayoutDashboardBase.tsx'
import {
  GridIcon,
  HandshakeIcon,
  HomeIcon,
  RocketIcon,
  TargetIcon,
} from '@/components/icons.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Company } from '@/lib/api.ts'
import { useOutletContext } from 'react-router-dom'

const ITENS_EMPRESA: ItemNavegacaoDashboard[] = [
  { rotulo: 'Dashboard', to: '/dashboard/empresa', Icone: HomeIcon, exato: true },
  { rotulo: 'Minhas demandas', to: '/dashboard/empresa/demandas', Icone: TargetIcon },
  { rotulo: 'Recomendações', to: '/dashboard/empresa/recomendacoes', Icone: RocketIcon },
  { rotulo: 'Conexões', to: '/dashboard/empresa/conexoes', Icone: HandshakeIcon },
  { rotulo: 'Catálogo', to: '/startups', Icone: GridIcon },
]

export default function LayoutDashboardEmpresa() {
  const contexto = useOutletContext<ContextoSessao>()
  const empresa = contexto.conta as Company

  return (
    <LayoutDashboardBase
      nomeUsuario={empresa.name}
      subtituloConta="Conta empresarial"
      badgePerfil={{
        rotulo: 'Empresa',
        classe: 'bg-accent-50 text-accent-700 ring-1 ring-accent-200',
      }}
      itensNavegacao={ITENS_EMPRESA}
      idPrefixo="empresa"
      redirecionarAposLogout="/entrar"
    />
  )
}

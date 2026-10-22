import LayoutDashboardBase, {
  type ItemNavegacaoDashboard,
} from '@/components/layout/LayoutDashboardBase.tsx'
import {
  CreditCardIcon,
  GridIcon,
  HomeIcon,
  TargetIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import type { Startup } from '@/lib/api.ts'
import { useOutletContext } from 'react-router-dom'

const ITENS_STARTUP: ItemNavegacaoDashboard[] = [
  { rotulo: 'Dashboard', to: '/dashboard/startup', Icone: HomeIcon, exato: true },
  { rotulo: 'Meu perfil', to: '/dashboard/startup/perfil', Icone: UserIcon },
  { rotulo: 'Oportunidades', to: '/dashboard/startup/oportunidades', Icone: TargetIcon },
  { rotulo: 'Conexões', to: '/dashboard/startup/conexoes', Icone: UsersIcon },
  { rotulo: 'Catálogo', to: '/startups', Icone: GridIcon },
  { rotulo: 'Plano', to: '/dashboard/startup/plano', Icone: CreditCardIcon },
]

export default function LayoutDashboardStartup() {
  const contexto = useOutletContext<ContextoSessao>()
  const startup = contexto.conta as Startup

  return (
    <LayoutDashboardBase
      nomeUsuario={startup.name}
      subtituloConta="Conta de startup"
      badgePerfil={{
        rotulo: 'Startup',
        classe: 'bg-brand-50 text-brand-700',
      }}
      itensNavegacao={ITENS_STARTUP}
      idPrefixo="startup"
      redirecionarAposLogout="/"
    />
  )
}

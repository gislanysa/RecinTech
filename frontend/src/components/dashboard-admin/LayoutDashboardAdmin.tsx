import LayoutDashboardBase, {
  type ItemNavegacaoDashboard,
} from '@/components/layout/LayoutDashboardBase.tsx'
import {
  BuildingIcon,
  HomeIcon,
  RocketIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons.tsx'

const ITENS_ADMIN: ItemNavegacaoDashboard[] = [
  { rotulo: 'Dashboard', to: '/dashboard/admin', Icone: HomeIcon, exato: true },
  { rotulo: 'Startups', to: '/dashboard/admin/startups', Icone: RocketIcon },
  { rotulo: 'Empresas', to: '/dashboard/admin/empresas', Icone: BuildingIcon },
  { rotulo: 'Administradores', to: '/dashboard/admin/usuarios', Icone: UsersIcon },
  { rotulo: 'Meu perfil', to: '/dashboard/admin/perfil', Icone: UserIcon },
]

export default function LayoutDashboardAdmin() {
  return (
    <LayoutDashboardBase
      nomeUsuario="Administrador"
      itensNavegacao={ITENS_ADMIN}
      idPrefixo="admin"
      redirecionarAposLogout="/entrar"
    />
  )
}

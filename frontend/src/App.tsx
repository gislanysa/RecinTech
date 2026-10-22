import RotaProtegida from '@/components/RotaProtegida.tsx'
import LayoutDashboardEmpresa from '@/components/dashboard-empresa/LayoutDashboardEmpresa.tsx'
import LayoutDashboardStartup from '@/components/dashboard-startup/LayoutDashboardStartup.tsx'
import SecaoEmBreve from '@/components/dashboard-startup/SecaoEmBreve.tsx'
import CriarConta from '@/pages/CriarConta.tsx'
import DashboardEmpresa from '@/pages/DashboardEmpresa.tsx'
import DashboardStartup from '@/pages/DashboardStartup.tsx'
import EmConstrucao from '@/pages/EmConstrucao.tsx'
import Entrar from '@/pages/Entrar.tsx'
import ExplorarStartups from '@/pages/ExplorarStartups.tsx'
import Home from '@/pages/Home.tsx'
import PaginaConexoesEmpresa from '@/pages/PaginaConexoesEmpresa.tsx'
import PaginaDemandasEmpresa from '@/pages/PaginaDemandasEmpresa.tsx'
import PaginaRecomendacoesEmpresa from '@/pages/PaginaRecomendacoesEmpresa.tsx'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import ParaEmpresas from '@/pages/ParaEmpresas.tsx'
import ParaStartups from '@/pages/ParaStartups.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route path="/" element={<Home />} />

        {/* Telas de outras branches trocar o marcador pelo componente real. */}
        <Route path="/startups" element={<ExplorarStartups />} />
        <Route path="/para-startups" element={<ParaStartups />} />
        <Route path="/para-empresas" element={<ParaEmpresas />} />
        <Route path="/entrar" element={<Entrar />} />

        {/* Cadastro de usuário */}
        <Route path="/criar-conta" element={<CriarConta />} />

        {/* Rotas privadas — sessão validada via cookie antes de renderizar */}
        <Route element={<RotaProtegida />}>
          <Route path="/startups/:id" element={<EmConstrucao titulo="Perfil da startup" />} />
        </Route>
        <Route element={<RotaProtegida tipo="startup" />}>
          <Route element={<LayoutDashboardStartup />}>
            <Route path="/dashboard/startup" element={<DashboardStartup />} />
            <Route path="/dashboard/startup/perfil" element={<SecaoEmBreve titulo="Meu perfil" />} />
            <Route path="/dashboard/startup/oportunidades" element={<SecaoEmBreve titulo="Oportunidades" />} />
            <Route path="/dashboard/startup/conexoes" element={<SecaoEmBreve titulo="Conexões" />} />
            <Route path="/dashboard/startup/plano" element={<SecaoEmBreve titulo="Plano" />} />
          </Route>
        </Route>
        <Route element={<RotaProtegida tipo="company" />}>
          <Route element={<LayoutDashboardEmpresa />}>
            <Route path="/dashboard/empresa" element={<DashboardEmpresa />} />
            <Route path="/dashboard/empresa/demandas" element={<PaginaDemandasEmpresa />} />
            <Route path="/dashboard/empresa/recomendacoes" element={<PaginaRecomendacoesEmpresa />} />
            <Route path="/dashboard/empresa/conexoes" element={<PaginaConexoesEmpresa />} />
          </Route>
        </Route>

        <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
  )
}

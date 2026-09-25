import RotaProtegida from '@/components/RotaProtegida.tsx'
import CriarConta from '@/pages/CriarConta.tsx'
import DashboardEmpresa from '@/pages/DashboardEmpresa.tsx'
import DashboardStartup from '@/pages/DashboardStartup.tsx'
import EmConstrucao from '@/pages/EmConstrucao.tsx'
import ParaEmpresas from '@/pages/ParaEmpresas.tsx'
import ExplorarStartups from '@/pages/ExplorarStartups.tsx'
import ParaStartups from '@/pages/ParaStartups.tsx'
import Entrar from '@/pages/Entrar.tsx'
import Home from '@/pages/Home.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Telas de outras branches trocar o marcador pelo componente real. */}
        <Route path="/startups" element={<ExplorarStartups />} />
        <Route path="/startups/:slug" element={<EmConstrucao titulo="Perfil da startup" />} />
        <Route path="/para-startups" element={<ParaStartups />} />
        <Route path="/para-empresas" element={<ParaEmpresas />} />
        <Route path="/entrar" element={<Entrar />} />

        {/* Cadastro de usuário */}
        <Route path="/criar-conta" element={<CriarConta />} />

        {/* Dashboards — sessão validada via cookie antes de renderizar */}
        <Route element={<RotaProtegida />}>
          <Route path="/dashboard/startup" element={<DashboardStartup />} />
          <Route path="/dashboard/empresa" element={<DashboardEmpresa />} />
        </Route>

        <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}

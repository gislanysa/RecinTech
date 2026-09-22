import CriarConta from '@/pages/CriarConta.tsx'
import DashboardEmpresa from '@/pages/DashboardEmpresa.tsx'
import DashboardStartup from '@/pages/DashboardStartup.tsx'
import EmConstrucao from '@/pages/EmConstrucao.tsx'
import Entrar from '@/pages/Entrar.tsx'
import Home from '@/pages/Home.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Telas de outras branches trocar o marcador pelo componente real. */}
        <Route path="/startups" element={<EmConstrucao titulo="Explorar startups" />} />
        <Route path="/para-startups" element={<EmConstrucao titulo="Para startups" />} />
        <Route path="/entrar" element={<Entrar />} />

        {/* Cadastro de usuário */}
        <Route path="/criar-conta" element={<CriarConta />} />

        {/* Dashboards cada tipo de conta tem a sua própria visão */}
        <Route path="/dashboard/startup" element={<DashboardStartup />} />
        <Route path="/dashboard/empresa" element={<DashboardEmpresa />} />

        <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}

import EmConstrucao from '@/pages/EmConstrucao.tsx'
import Home from '@/pages/Home.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Telas de outras branches — trocar o marcador pelo componente real. */}
        <Route path="/startups" element={<EmConstrucao titulo="Explorar startups" />} />
        <Route path="/para-startups" element={<EmConstrucao titulo="Para startups" />} />
        <Route path="/entrar" element={<EmConstrucao titulo="Acessar conta" />} />
        <Route path="/criar-conta" element={<EmConstrucao titulo="Criar conta" />} />
        <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}

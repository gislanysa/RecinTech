import RotaProtegida from '@/components/RotaProtegida.tsx'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import * as api from '@/lib/api.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let triggerSessaoExpirada: (() => void) | null = null

vi.mock('@/lib/api.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api.ts')>()
  return {
    ...mod,
    restaurarSessao: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    renovarSessao: vi.fn().mockResolvedValue(true),
    tipoDaConta: vi.fn((dados: any) => mod.tipoDaConta(dados)),
    aoExpirarSessao: vi.fn((callback) => {
      triggerSessaoExpirada = callback
      return () => {
        triggerSessaoExpirada = null
      }
    }),
  }
})

describe('Fluxo de RotaProtegida e Sessão Expirada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    triggerSessaoExpirada = null
  })

  function renderizarApp(initialEntry = '/dashboard/startup', tipoRota?: 'startup' | 'company') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/entrar" element={<div>Página de Login</div>} />
            <Route path="/dashboard/empresa" element={<div>Dashboard da Empresa</div>} />
            <Route element={<RotaProtegida tipo={tipoRota} />}>
              <Route path="/dashboard/startup" element={<div>Área Protegida Startup</div>} />
              <Route path="/dashboard/comum" element={<div>Área Protegida Comum</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('deve exibir tela de carregamento enquanto a sessão estiver sendo restaurada', () => {
    // Promise pendente
    vi.mocked(api.restaurarSessao).mockReturnValueOnce(new Promise(() => {}))

    renderizarApp('/dashboard/startup', 'startup')

    expect(screen.getByText('Verificando sessão…')).toBeInTheDocument()
  })

  it('deve redirecionar para /entrar quando o usuário não estiver autenticado (401)', async () => {
    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(null)

    renderizarApp('/dashboard/startup', 'startup')

    expect(await screen.findByText('Página de Login')).toBeInTheDocument()
    expect(screen.queryByText('Área Protegida Startup')).not.toBeInTheDocument()
  })

  it('deve permitir acesso à rota protegida quando o usuário estiver autenticado com o tipo correto', async () => {
    const startupMock: api.Startup = {
      id: 'st-1',
      name: 'Startup Teste',
      email: 'teste@startup.com',
      stage: 'traction',
      cnpj: '12345678000190',
      description: '',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(startupMock)

    renderizarApp('/dashboard/startup', 'startup')

    expect(await screen.findByText('Área Protegida Startup')).toBeInTheDocument()
  })

  it('deve redirecionar para /dashboard/empresa quando uma Empresa tentar acessar rota exclusiva de Startup', async () => {
    const companyMock: api.Company = {
      id: 'co-1',
      name: 'Empresa Teste',
      email: 'contato@empresa.com',
      size: 'medium',
      cnpj: '98765432000100',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(companyMock)

    renderizarApp('/dashboard/startup', 'startup')

    expect(await screen.findByText('Dashboard da Empresa')).toBeInTheDocument()
    expect(screen.queryByText('Área Protegida Startup')).not.toBeInTheDocument()
  })

  it('deve exibir tela de falha temporária em erro de rede e permitir tentar novamente sem deslogar', async () => {
    // Simula erro de rede ou 500 do backend
    vi.mocked(api.restaurarSessao).mockRejectedValueOnce(new Error('Network Error'))

    renderizarApp('/dashboard/startup', 'startup')

    expect(await screen.findByText('Instabilidade de conexão')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    // Garante que NÃO deslogou nem redirecionou para login
    expect(screen.queryByText('Página de Login')).not.toBeInTheDocument()

    // Agora o servidor volta a responder normalmente
    const startupMock: api.Startup = {
      id: 'st-1',
      name: 'Startup Teste',
      email: 'teste@startup.com',
      stage: 'traction',
      cnpj: '12345678000190',
      description: '',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }
    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(startupMock)

    // Clica em Tentar novamente
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('Área Protegida Startup')).toBeInTheDocument()
  })

  it('deve deslogar e limpar a sessão quando o interceptor de 401 disparar aoExpirarSessao', async () => {
    const startupMock: api.Startup = {
      id: 'st-1',
      name: 'Startup Teste',
      email: 'teste@startup.com',
      stage: 'traction',
      cnpj: '12345678000190',
      description: '',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(startupMock)

    renderizarApp('/dashboard/startup', 'startup')

    expect(await screen.findByText('Área Protegida Startup')).toBeInTheDocument()

    // Simula disparo do interceptor de 401 (sessão expirou no servidor durante navegação)
    expect(triggerSessaoExpirada).not.toBeNull()
    triggerSessaoExpirada!()

    await waitFor(() => {
      expect(screen.getByText('Página de Login')).toBeInTheDocument()
    })
    expect(screen.queryByText('Área Protegida Startup')).not.toBeInTheDocument()
  })
})

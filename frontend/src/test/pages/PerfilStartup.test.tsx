import PerfilStartup from '@/pages/PerfilStartup.tsx'
import type { ContaLogada, Startup } from '@/lib/api.ts'
import * as startups from '@/lib/startups.ts'
import * as useAuthModule from '@/contexts/useAuth.ts'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/startups.ts', () => ({
  buscarStartupPorId: vi.fn(),
  carregarTagsDaStartup: vi.fn(),
  iniciais: vi.fn((nome: string) => nome.slice(0, 2).toUpperCase()),
}))

vi.mock(import('@/lib/canvas.ts'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    carregarCanvas: vi.fn().mockResolvedValue({
      customer_segments: '',
      value_proposition: '',
      channels: '',
      customer_relationships: '',
      revenue_streams: '',
      key_resources: '',
      key_activities: '',
      key_partnerships: '',
      cost_structure: '',
    }),
  }
})

vi.mock('@/contexts/useAuth.ts', () => ({
  useAuth: vi.fn(),
}))

const startupMock: Startup = {
  id: 'startup-123',
  name: 'Minha Startup',
  email: 'contato@minha.com',
  stage: 'traction',
  cnpj: '12345678000199',
  description: 'Descrição da startup',
  city: 'Recife',
  state: 'PE',
  website: 'https://minha.com',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

function renderPerfil(id = 'startup-123') {
  return render(
    <MemoryRouter initialEntries={[`/startups/${id}`]}>
      <Routes>
        <Route path="/startups/:id" element={<PerfilStartup />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PerfilStartup - Botão Voltar contextual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(startups.buscarStartupPorId).mockResolvedValue(startupMock)
    vi.mocked(startups.carregarTagsDaStartup).mockResolvedValue({
      area: 'Tecnologia',
      services: ['Desenvolvimento Web'],
      technologies: ['React'],
      segments: ['Fintech'],
    })
  })

  it('exibe "Voltar para meu perfil" com link para /dashboard/startup/perfil quando a própria startup visualiza', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      conta: startupMock as ContaLogada,
      tipoConta: 'startup',
      estado: 'autenticado',
      login: vi.fn(),
      logout: vi.fn(),
      recarregarSessao: vi.fn(),
      definirConta: vi.fn(),
    })

    renderPerfil('startup-123')

    await waitFor(() => {
      expect(screen.getByText('Minha Startup')).toBeInTheDocument()
    })

    const botaoVoltar = screen.getByRole('link', { name: /Voltar para meu perfil/i })
    expect(botaoVoltar).toBeInTheDocument()
    expect(botaoVoltar).toHaveAttribute('href', '/dashboard/startup/perfil')
  })

  it('exibe "Voltar para o catálogo" com link para /dashboard/empresa/catalogo quando uma empresa visualiza', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      conta: {
        id: 'empresa-456',
        name: 'Empresa Teste',
        email: 'empresa@teste.com',
        cnpj: '11222333000144',
        size: 'micro',
        city: 'Recife',
        state: 'PE',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      } as ContaLogada,
      tipoConta: 'company',
      estado: 'autenticado',
      login: vi.fn(),
      logout: vi.fn(),
      recarregarSessao: vi.fn(),
      definirConta: vi.fn(),
    })

    renderPerfil('startup-123')

    await waitFor(() => {
      expect(screen.getByText('Minha Startup')).toBeInTheDocument()
    })

    const botaoVoltar = screen.getByRole('link', { name: /Voltar para o catálogo/i })
    expect(botaoVoltar).toBeInTheDocument()
    expect(botaoVoltar).toHaveAttribute('href', '/dashboard/empresa/catalogo')
  })

  it('exibe "Voltar para a busca" com link para /startups quando visitante não autenticado visualiza', async () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      conta: null,
      tipoConta: null,
      estado: 'nao-autenticado',
      login: vi.fn(),
      logout: vi.fn(),
      recarregarSessao: vi.fn(),
      definirConta: vi.fn(),
    })

    renderPerfil('startup-123')

    await waitFor(() => {
      expect(screen.getByText('Minha Startup')).toBeInTheDocument()
    })

    const botaoVoltar = screen.getByRole('link', { name: /Voltar para a busca/i })
    expect(botaoVoltar).toBeInTheDocument()
    expect(botaoVoltar).toHaveAttribute('href', '/startups')
  })
})

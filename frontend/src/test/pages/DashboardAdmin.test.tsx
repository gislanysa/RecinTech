import DashboardAdmin from '@/pages/DashboardAdmin.tsx'
import {
  type Admin,
  sincronizarContaAdmin,
  registrarContratacaoPlanoDestaque,
  registrarContratacaoDesbloqueio,
} from '@/lib/admin.ts'
import { salvarDemandaPublica } from '@/lib/demandas.ts'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAdmin: Admin = {
  id: 'admin-master',
  name: 'Administrador Teste',
  email: 'admin@recintech.com',
  role: 'admin',
  cargo: 'Governança',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ conta: mockAdmin }),
  }
})

describe('DashboardAdmin - Painel e Métricas Globais do Administrador', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('deve renderizar o título Administrador e as métricas globais da plataforma', () => {
    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Administrador' })).toBeInTheDocument()
    expect(screen.queryByText('Painel de Governança')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gerenciar Admins/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gerenciar Startups/i })).not.toBeInTheDocument()

    expect(screen.getByText('Startups')).toBeInTheDocument()
    expect(screen.getByText('Empresas')).toBeInTheDocument()
    expect(screen.getByText('Demandas & Volume')).toBeInTheDocument()
    expect(screen.getByText('Monetização Ativa')).toBeInTheDocument()
    expect(screen.getByText('Plano Destaque')).toBeInTheDocument()
    expect(screen.getByText('Desbloqueio de Lista')).toBeInTheDocument()
    expect(screen.getAllByText('Nenhum pacote contratado no momento.')).toHaveLength(2)
  })

  it('não deve exibir tags de valores financeiros no card de monetização ativa', () => {
    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/R\$ 40\/mês/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/R\$ 79\/demanda/i)).not.toBeInTheDocument()
  })

  it('deve exibir tabelas operacionais vazias quando não existirem usuários reais cadastrados', () => {
    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    )

    expect(screen.getByText('Startups Cadastradas')).toBeInTheDocument()
    expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma startup cadastrada até o momento.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma empresa cadastrada até o momento.')).toBeInTheDocument()

    const linksVerTodas = screen.getAllByRole('link', { name: /Ver todas/i })
    expect(linksVerTodas[0]).toHaveAttribute('href', '/dashboard/admin/startups')
    expect(linksVerTodas[1]).toHaveAttribute('href', '/dashboard/admin/empresas')
  })

  it('deve renderizar dados reais quando startups, empresas e demandas reais forem cadastradas', () => {
    sincronizarContaAdmin({
      id: 'startup-real-abc',
      name: 'BioTech Nordeste',
      stage: 'scaling',
      city: 'Olinda',
      state: 'PE',
    })

    sincronizarContaAdmin({
      id: 'empresa-real-xyz',
      name: 'Varejo Central',
      size: 'big',
      city: 'Recife',
      state: 'PE',
      email: 'contato@varejocentral.com',
    })

    salvarDemandaPublica({
      id: 'demanda-real-1',
      company_id: 'empresa-real-xyz',
      titulo: 'Automação de Estoque',
      descricao: 'Sistema em tempo real de contagem',
      segmento: 'Varejo',
      servicos: ['Automação'],
      tecnologias: ['Node.js'],
      orcamento: 35000,
      status: 'aberta',
      created_at: '2026-02-01',
    }, 'Varejo Central')

    registrarContratacaoPlanoDestaque('startup-real-abc')
    registrarContratacaoDesbloqueio('empresa-real-xyz')

    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    )

    expect(screen.getByText('BioTech Nordeste')).toBeInTheDocument()
    expect(screen.getByText('Varejo Central')).toBeInTheDocument()
    expect(screen.getByText(/Porte Grande/i)).toBeInTheDocument()
    expect(screen.getByText(/1 startup contratou o pacote/i)).toBeInTheDocument()
    expect(screen.getByText(/1 empresa contratou o desbloqueio/i)).toBeInTheDocument()
    expect(screen.getByText(/100% \(1 demanda\)/i)).toBeInTheDocument()
  })
})

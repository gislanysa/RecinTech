import {
  atualizarDemanda,
  calcularRecomendacoes,
  criarDemanda,
  excluirDemanda,
  enviarConviteReuniao,
  listarConvites,
  listarDemandas,
  type Demanda,
} from '@/lib/demandas.ts'
import { api } from '@/lib/api.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('demandas.ts - Integração HTTP com a API', () => {
  const companyId = 'empresa-abc'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve listar demandas da empresa através de GET /company/:id/demand', async () => {
    const mockDemandas: Demanda[] = [
      {
        id: 'dem-1',
        company_id: companyId,
        titulo: 'Coleta de baterias',
        descricao: 'Necessitamos de startup para logística reversa de baterias',
        segmento: 'Cleantech / Sustentabilidade',
        servicos: ['Consultoria'],
        tecnologias: ['Python'],
        status: 'aberta',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDemandas })

    const resultado = await listarDemandas(companyId)

    expect(api.get).toHaveBeenCalledWith(`/company/${companyId}/demand`)
    expect(resultado).toEqual(mockDemandas)
  })

  it('deve criar uma nova demanda via POST /company/:id/demand com campos aparados', async () => {
    const dados = {
      titulo: '  Desenvolvimento de painel solar inteligente  ',
      descricao: '  Software de rastreamento de eficiência energética  ',
      segmento: 'Cleantech / Sustentabilidade',
      servicos: ['Desenvolvimento Web'],
      tecnologias: ['React', 'Node.js'],
    }

    const mockResposta: Demanda = {
      id: 'dem-gerada-123',
      company_id: companyId,
      titulo: 'Desenvolvimento de painel solar inteligente',
      descricao: 'Software de rastreamento de eficiência energética',
      segmento: dados.segmento,
      servicos: dados.servicos,
      tecnologias: dados.tecnologias,
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResposta })

    const resultado = await criarDemanda(companyId, dados)

    expect(api.post).toHaveBeenCalledWith(`/company/${companyId}/demand`, {
      titulo: 'Desenvolvimento de painel solar inteligente',
      descricao: 'Software de rastreamento de eficiência energética',
      segmento: dados.segmento,
      servicos: dados.servicos,
      tecnologias: dados.tecnologias,
    })
    expect(resultado).toEqual(mockResposta)
  })

  it('deve atualizar demanda existente via PUT /company/:id/demand/:demandaId', async () => {
    const demandaId = 'dem-123'
    const dadosAtualizados = {
      titulo: 'Demanda Atualizada',
      descricao: 'Nova descrição',
      segmento: 'Agritech',
      servicos: ['Automação'],
      tecnologias: ['Python'],
      status: 'em_andamento' as const,
    }

    const mockResposta: Demanda = {
      id: demandaId,
      company_id: companyId,
      ...dadosAtualizados,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.put).mockResolvedValueOnce({ data: mockResposta })

    const resultado = await atualizarDemanda(companyId, demandaId, dadosAtualizados)

    expect(api.put).toHaveBeenCalledWith(
      `/company/${companyId}/demand/${demandaId}`,
      dadosAtualizados,
    )
    expect(resultado).toEqual(mockResposta)
  })

  it('deve excluir uma demanda via DELETE /company/:id/demand/:demandaId', async () => {
    const demandaId = 'dem-para-remover'
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await excluirDemanda(companyId, demandaId)

    expect(api.delete).toHaveBeenCalledWith(`/company/${companyId}/demand/${demandaId}`)
  })

  it('deve listar convites de reunião via GET /company/:id/meetings', async () => {
    const mockConvites = [
      {
        id: 'conv-1',
        company_id: companyId,
        startup_id: 'start-1',
        startup_nome: 'Recicla Fácil',
        status: 'pendente' as const,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockConvites })

    const resultado = await listarConvites(companyId)

    expect(api.get).toHaveBeenCalledWith(`/company/${companyId}/meetings`)
    expect(resultado).toEqual(mockConvites)
  })

  it('deve enviar convite de reunião via POST /company/:id/meetings', async () => {
    const dadosConvite = {
      startupId: 'start-2',
      startupNome: 'Inovação Verde',
      demandaId: 'dem-1',
      demandaTitulo: 'Gestão de Resíduos',
      mensagem: 'Olá, gostaríamos de agendar uma reunião.',
    }

    const mockResposta = {
      id: 'conv-2',
      company_id: companyId,
      startup_id: dadosConvite.startupId,
      startup_nome: dadosConvite.startupNome,
      demanda_id: dadosConvite.demandaId,
      demanda_titulo: dadosConvite.demandaTitulo,
      mensagem: dadosConvite.mensagem,
      status: 'pendente' as const,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResposta })

    const resultado = await enviarConviteReuniao(companyId, dadosConvite)

    expect(api.post).toHaveBeenCalledWith(`/company/${companyId}/meetings`, {
      startup_id: dadosConvite.startupId,
      startup_nome: dadosConvite.startupNome,
      demanda_id: dadosConvite.demandaId,
      demanda_titulo: dadosConvite.demandaTitulo,
      mensagem: dadosConvite.mensagem,
    })
    expect(resultado).toEqual(mockResposta)
  })
})

describe('demandas.ts - Algoritmo de recomendações', () => {
  const startups: StartupCatalogo[] = [
    {
      id: 'st-1',
      name: 'VerdeTech',
      slug: 'verdetech',
      email: 'contato@verdetech.com',
      initials: 'VT',
      area: 'Sustentabilidade',
      tagline: 'Soluções verdes',
      description: 'Descrição',
      city: 'Recife',
      state: 'PE',
      website: 'https://verdetech.com',
      stage: 'traction',
      cnpj: '11111111000111',
      services: ['Consultoria', 'Auditoria'],
      technologies: ['React', 'Python'],
      segments: ['Cleantech / Sustentabilidade'],
      remote: true,
      onsite: true,
      relevance: 0,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'st-2',
      name: 'EducaInova',
      slug: 'educainova',
      email: 'contato@educainova.com',
      initials: 'EI',
      area: 'Educação',
      tagline: 'Plataforma educacional',
      description: 'Descrição',
      city: 'Recife',
      state: 'PE',
      website: 'https://educainova.com',
      stage: 'scaling',
      cnpj: '22222222000122',
      services: ['Desenvolvimento Web'],
      technologies: ['Node.js'],
      segments: ['Edtech'],
      remote: true,
      onsite: true,
      relevance: 0,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  ]

  it('deve relacionar demandas com startups compatíveis por segmento e tecnologia', () => {
    const demandas: Demanda[] = [
      {
        id: 'dem-1',
        company_id: 'emp-1',
        titulo: 'Software de Reciclagem',
        descricao: 'Descrição',
        segmento: 'Cleantech / Sustentabilidade',
        servicos: ['Consultoria'],
        tecnologias: ['Python'],
        status: 'aberta',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const recomendacoes = calcularRecomendacoes(demandas, startups)

    expect(recomendacoes).toHaveLength(1)
    expect(recomendacoes[0].startup.id).toBe('st-1')
    expect(recomendacoes[0].demanda.id).toBe('dem-1')
    expect(recomendacoes[0].motivos).toContain('Segmento compatível: Cleantech / Sustentabilidade')
    expect(recomendacoes[0].motivos).toContain('Serviços: Consultoria')
    expect(recomendacoes[0].motivos).toContain('Tecnologias: Python')
  })

  it('deve ignorar demandas com status encerrada', () => {
    const demandas: Demanda[] = [
      {
        id: 'dem-encerrada',
        company_id: 'emp-1',
        titulo: 'Demanda Finalizada',
        descricao: 'Descrição',
        segmento: 'Cleantech / Sustentabilidade',
        servicos: ['Consultoria'],
        tecnologias: ['Python'],
        status: 'encerrada',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    const recomendacoes = calcularRecomendacoes(demandas, startups)
    expect(recomendacoes).toHaveLength(0)
  })
})

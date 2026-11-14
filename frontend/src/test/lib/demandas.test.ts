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
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('demandas.ts - Integração HTTP com a API', () => {
  const companyId = 'empresa-abc'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve listar demandas da empresa através de GET /company/:id/demand consumindo o contrato real do backend', async () => {
    // Resposta real conforme rota Gleam GET /api/company/:id/demand
    const backendRealResponse = [
      {
        id: '01a173cb-9533-7ebd-87a0-590965ef3653',
        company_id: companyId,
        title: 'Need more gleam projects',
        description: 'A lot more of them',
        status: 'open',
        created_at: '2025-09-14T20:08:02.000Z',
        updated_at: '2025-09-14T20:08:02.000Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: backendRealResponse })

    const resultado = await listarDemandas(companyId, 10, 20)

    expect(api.get).toHaveBeenCalledWith(`/company/${companyId}/demand`, {
      params: { limit: 10, offset: 20 },
    })
    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('01a173cb-9533-7ebd-87a0-590965ef3653')
    expect(resultado[0].titulo).toBe('Need more gleam projects')
    expect(resultado[0].descricao).toBe('A lot more of them')
    expect(resultado[0].status).toBe('aberta')
  })

  it('deve criar uma nova demanda via POST /company/:id/demand com payload e resposta reais do backend', async () => {
    const dados = {
      titulo: '  Desenvolvimento de painel solar inteligente  ',
      descricao: '  Software de rastreamento de eficiência energética  ',
      segmento: 'Cleantech / Sustentabilidade',
      servicos: ['Desenvolvimento Web'],
      tecnologias: ['React', 'Node.js'],
    }

    // Resposta real conforme register_demand em web.gleam
    const mockRespostaBackend = {
      demand: {
        id: '01a173cb-9533-7ebd-87a0-590965ef3653',
        company_id: companyId,
        title: 'Desenvolvimento de painel solar inteligente',
        description: 'Software de rastreamento de eficiência energética',
        status: 'open',
        created_at: '2025-09-14T20:08:02.000Z',
        updated_at: '2025-09-14T20:08:02.000Z',
      },
      expertises: [],
      segments: [],
      services: [],
      technologies: [],
    }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockRespostaBackend })

    const resultado = await criarDemanda(companyId, dados)

    expect(api.post).toHaveBeenCalledWith(
      `/company/${companyId}/demand`,
      expect.objectContaining({
        title: 'Desenvolvimento de painel solar inteligente',
        description: 'Software de rastreamento de eficiência energética',
        status: 'open',
      }),
    )
    expect(resultado.id).toBe('01a173cb-9533-7ebd-87a0-590965ef3653')
    expect(resultado.titulo).toBe('Desenvolvimento de painel solar inteligente')
    expect(resultado.descricao).toBe('Software de rastreamento de eficiência energética')
    expect(resultado.status).toBe('aberta')
  })

  it('deve atualizar demanda existente via PATCH /company/demand/:demandaId', async () => {
    const demandaId = 'dem-123'
    const dadosAtualizados = {
      titulo: 'Demanda Atualizada',
      descricao: 'Nova descrição',
      segmento: 'Agritech',
      servicos: ['Automação'],
      tecnologias: ['Python'],
      status: 'em_andamento' as const,
    }

    const mockResposta = {
      id: demandaId,
      company_id: companyId,
      title: dadosAtualizados.titulo,
      description: dadosAtualizados.descricao,
      status: 'open',
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockResposta })

    const resultado = await atualizarDemanda(companyId, demandaId, dadosAtualizados)

    expect(api.patch).toHaveBeenCalledWith(
      `/company/demand/${demandaId}`,
      expect.objectContaining({
        title: 'Demanda Atualizada',
        description: 'Nova descrição',
      }),
    )
    expect(resultado.id).toBe(demandaId)
    expect(resultado.titulo).toBe('Demanda Atualizada')
  })

  it('deve excluir uma demanda via DELETE /company/demand/:demandaId', async () => {
    const demandaId = 'dem-para-remover'
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null })

    await excluirDemanda(companyId, demandaId)

    expect(api.delete).toHaveBeenCalledWith(`/company/demand/${demandaId}`)
  })

  it('deve listar conexões da empresa via GET /company/:id/connection', async () => {
    const mockConexoes = [
      {
        company: companyId,
        startup: 'start-1',
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockConexoes })

    const resultado = await listarConvites(companyId)

    expect(api.get).toHaveBeenCalledWith(`/company/${companyId}/connection`)
    expect(resultado[0].company_id).toBe(companyId)
    expect(resultado[0].startup_id).toBe('start-1')
    expect(resultado[0].status).toBe('pendente')
  })

  it('deve enviar solicitação de conexão via POST /company/:id/connection', async () => {
    const dadosConvite = {
      startupId: 'start-2',
      startupNome: 'Inovação Verde',
      demandaId: 'dem-1',
      demandaTitulo: 'Gestão de Resíduos',
      mensagem: 'Olá, gostaríamos de agendar uma reunião.',
    }

    const mockResposta = {
      company: companyId,
      startup: dadosConvite.startupId,
      status: 'pending',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResposta })

    const resultado = await enviarConviteReuniao(companyId, dadosConvite)

    expect(api.post).toHaveBeenCalledWith(`/company/${companyId}/connection`, {
      startup: dadosConvite.startupId,
    })
    expect(resultado.startup_id).toBe(dadosConvite.startupId)
    expect(resultado.status).toBe('pendente')
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

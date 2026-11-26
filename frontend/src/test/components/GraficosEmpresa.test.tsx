import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GraficosEmpresa from '@/components/dashboard-empresa/GraficosEmpresa.tsx'
import type { Demanda, CandidaturaDemanda } from '@/lib/demandas.ts'

describe('GraficosEmpresa (Critério 6 — Dashboards)', () => {
  const demandasMock: Demanda[] = [
    {
      id: 'demanda-1',
      company_id: 'empresa-1',
      titulo: 'Plataforma B2B em Nuvem',
      descricao: 'Desenvolvimento de backend escalável',
      segmento: 'Tecnologia',
      servicos: ['Cloud'],
      status: 'aberta',
      orcamento: 30000,
      tecnologias: ['Node.js', 'PostgreSQL'],
      created_at: '2026-11-20T10:00:00Z',
    },
  ]

  it('deve exibir mensagem orientativa e estado vazio quando não houver candidaturas', () => {
    render(
      <GraficosEmpresa
        demandas={[]}
        candidaturasIniciais={[]}
      />,
    )

    expect(
      screen.getByText('Status das Candidaturas Recebidas'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma candidatura recebida ainda'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Compatibilidade das Recomendações'),
    ).not.toBeInTheDocument()
  })

  it('deve renderizar status das candidaturas recebidas com fatias de aceitas, pendentes e recusadas', () => {
    const candidaturas: CandidaturaDemanda[] = [
      {
        demand: 'demanda-1',
        startup: 'startup-1',
        status: 'accepted',
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-21T10:00:00Z',
      },
      {
        demand: 'demanda-1',
        startup: 'startup-2',
        status: 'pending',
        tipo_proposta: 'contraproposta',
        valor_proposto: 35000,
        justificativa: 'Escopo ampliado com IA',
        created_at: '2026-11-22T10:00:00Z',
        updated_at: '2026-11-22T10:00:00Z',
      },
      {
        demand: 'demanda-1',
        startup: 'startup-3',
        status: 'declined',
        created_at: '2026-11-23T10:00:00Z',
        updated_at: '2026-11-24T10:00:00Z',
      },
    ]

    render(
      <GraficosEmpresa
        demandas={demandasMock}
        candidaturasIniciais={candidaturas}
      />,
    )

    // Total de 3 candidaturas
    expect(screen.getByText('3 candidaturas')).toBeInTheDocument()
    expect(screen.getByText(/Aceitas \(Match\)/)).toBeInTheDocument()
    expect(screen.getByText(/Em análise \(Pendentes\)/)).toBeInTheDocument()
    expect(screen.getByText(/Não seguiu \(Recusadas\)/)).toBeInTheDocument()

    // 1 contraproposta financeira ativa
    expect(
      screen.getByText('1 candidatura com contraproposta financeira'),
    ).toBeInTheDocument()
  })
})

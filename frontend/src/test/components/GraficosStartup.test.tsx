import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GraficosStartup from '@/components/dashboard-startup/GraficosStartup.tsx'
import type { Conexao } from '@/lib/oportunidades.ts'
import type { Demanda } from '@/lib/demandas.ts'

describe('GraficosStartup (Critério 6 — Dashboards)', () => {
  const demandasMock: Demanda[] = [
    {
      id: 'd1',
      company_id: 'emp-1',
      titulo: 'Desenvolvimento IA',
      descricao: 'Visão computacional e NLP',
      segmento: 'Inteligência Artificial',
      servicos: ['Machine Learning'],
      tecnologias: ['Python', 'PyTorch'],
      status: 'aberta',
      created_at: '',
    },
    {
      id: 'd2',
      company_id: 'emp-2',
      titulo: 'Infraestrutura Cloud',
      descricao: 'Migração para Kubernetes',
      segmento: 'Cloud & DevOps',
      servicos: ['Cloud'],
      tecnologias: ['Kubernetes', 'AWS'],
      status: 'aberta',
      created_at: '',
    },
    {
      id: 'd3',
      company_id: 'emp-3',
      titulo: 'Dashboard Analytics',
      descricao: 'Painel em Python e dados',
      segmento: 'Inteligência Artificial',
      servicos: ['Analytics'],
      tecnologias: ['Python'],
      status: 'aberta',
      created_at: '',
    },
  ]

  it('deve exibir mensagem orientativa e estado vazio quando não houver demandas nem conexões', () => {
    render(
      <GraficosStartup
        conexoes={[]}
        demandasIniciais={[]}
      />,
    )

    expect(
      screen.getByText('Demandas por Segmento Técnico'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Proporção de Propostas Aceitas'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma demanda mapeada ainda'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma proposta enviada ainda'),
    ).toBeInTheDocument()
  })

  it('deve agrupar demandas por segmento técnico e identificar tags compatíveis com o perfil da startup', () => {
    render(
      <GraficosStartup
        conexoes={[]}
        tags={{
          area: 'Inteligência Artificial',
          services: ['Machine Learning'],
          technologies: ['Python'],
          segments: ['Inteligência Artificial'],
        }}
        demandasIniciais={demandasMock}
      />,
    )

    // Inteligência Artificial (2 demandas) e Cloud & DevOps (1 demanda)
    expect(screen.getByText('Inteligência Artificial')).toBeInTheDocument()
    expect(screen.getByText('Cloud & DevOps')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()

    // Badge "Seu perfil" para segmentos/tecs atendidos
    const badgesPerfil = screen.getAllByText('Seu perfil')
    expect(badgesPerfil.length).toBeGreaterThan(0)
  })

  it('deve calcular taxa de conversão / aceite e proporção de propostas', () => {
    const conexoes: Conexao[] = [
      {
        id: 'c1',
        oportunidade: {
          id: 'o1',
          empresa: 'Empresa Alpha',
          demanda: 'Projeto IA',
          compatibilidade: 90,
          tecnologias: [],
        },
        iniciado_por: 'startup',
        status: 'aceito',
        created_at: '',
      },
      {
        id: 'c2',
        oportunidade: {
          id: 'o2',
          empresa: 'Empresa Beta',
          demanda: 'Projeto Cloud',
          compatibilidade: 80,
          tecnologias: [],
        },
        iniciado_por: 'startup',
        status: 'pendente',
        created_at: '',
      },
      {
        id: 'c3',
        oportunidade: {
          id: 'o3',
          empresa: 'Empresa Gamma',
          demanda: 'Projeto Legacy',
          compatibilidade: 50,
          tecnologias: [],
        },
        iniciado_por: 'startup',
        status: 'recusado',
        created_at: '',
      },
    ]

    render(
      <GraficosStartup
        conexoes={conexoes}
        demandasIniciais={demandasMock}
      />,
    )

    // 1 aceito de 3 = 33%
    expect(screen.getByText('33% de Aceite')).toBeInTheDocument()
    expect(screen.getByText('Propostas Aceitas (Match)')).toBeInTheDocument()
    expect(screen.getByText('Em Análise (Aguardando)')).toBeInTheDocument()
    expect(screen.getByText('Não seguiu (Recusadas)')).toBeInTheDocument()
    expect(screen.getByText('3 propostas')).toBeInTheDocument()
  })
})

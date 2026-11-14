import ModalNovaDemanda from '@/components/dashboard-empresa/ModalNovaDemanda.tsx'
import * as catalogos from '@/lib/catalogos.ts'
import * as demandasLib from '@/lib/demandas.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/catalogos.ts', () => ({
  buscarSegmentos: vi.fn(),
  buscarServicos: vi.fn(),
  buscarTecnologias: vi.fn(),
}))

vi.mock('@/lib/demandas.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/demandas.ts')>()
  return {
    ...mod,
    criarDemanda: vi.fn(),
    atualizarDemanda: vi.fn(),
  }
})

describe('Fluxo de Demanda - Criação e Edição (ModalNovaDemanda)', () => {
  const companyId = 'empresa-abc'

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(catalogos.buscarSegmentos).mockResolvedValue([
      { id: 'seg-1', name: 'Agritech', description: 'Tecnologia no campo' },
      { id: 'seg-2', name: 'Cleantech', description: 'Sustentabilidade' },
    ])
    vi.mocked(catalogos.buscarServicos).mockResolvedValue([
      { id: 'serv-1', name: 'Consultoria ESG', description: 'Consultoria' },
      { id: 'serv-2', name: 'Desenvolvimento Web', description: 'Web' },
    ])
    vi.mocked(catalogos.buscarTecnologias).mockResolvedValue([
      { id: 'tec-1', name: 'Python', description: 'Linguagem' },
      { id: 'tec-2', name: 'React', description: 'Frontend' },
    ])
  })

  it('deve carregar os catálogos dinâmicos e validar campos obrigatórios', async () => {
    render(
      <ModalNovaDemanda
        aberto={true}
        companyId={companyId}
        aoFechar={vi.fn()}
        aoSalvar={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: /nova demanda/i })).toBeInTheDocument()

    // Aguarda carregar opções dos catálogos
    expect(await screen.findByRole('button', { name: 'Consultoria ESG' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument()

    // Clica em Cadastrar sem preencher campos
    fireEvent.submit(screen.getByRole('button', { name: /cadastrar demanda/i }).closest('form')!)

    expect(await screen.findByText('Informe o título da demanda.')).toBeInTheDocument()
    expect(demandasLib.criarDemanda).not.toHaveBeenCalled()
  })

  it('deve criar uma nova demanda com sucesso e chamar aoSalvar', async () => {
    const aoSalvarMock = vi.fn()
    const aoFecharMock = vi.fn()

    const novaDemandaCriada: demandasLib.Demanda = {
      id: 'dem-nova-1',
      company_id: companyId,
      titulo: 'Rastreabilidade de Resíduos',
      descricao: 'Sistema para rastrear resíduos sólidos industriais',
      segmento: 'Cleantech',
      servicos: ['Consultoria ESG'],
      tecnologias: ['Python'],
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(demandasLib.criarDemanda).mockResolvedValueOnce(novaDemandaCriada)

    render(
      <ModalNovaDemanda
        aberto={true}
        companyId={companyId}
        aoFechar={aoFecharMock}
        aoSalvar={aoSalvarMock}
      />,
    )

    // Aguarda carregar opções do catálogo
    expect(await screen.findByRole('button', { name: 'Consultoria ESG' })).toBeInTheDocument()

    // Preenche título e descrição
    fireEvent.change(screen.getByLabelText(/título da demanda/i), {
      target: { value: 'Rastreabilidade de Resíduos' },
    })
    fireEvent.change(screen.getByLabelText(/descrição da necessidade/i), {
      target: { value: 'Sistema para rastrear resíduos sólidos industriais' },
    })

    // Seleciona segmento
    fireEvent.change(screen.getByLabelText(/segmento de atuação/i), {
      target: { value: 'Cleantech' },
    })

    // Seleciona tecnologia e serviço
    fireEvent.click(screen.getByRole('button', { name: 'Consultoria ESG' }))
    fireEvent.click(screen.getByRole('button', { name: 'Python' }))

    // Submete o formulário
    fireEvent.submit(screen.getByRole('button', { name: /cadastrar demanda/i }).closest('form')!)

    await waitFor(() => {
      expect(demandasLib.criarDemanda).toHaveBeenCalledWith(
        companyId,
        expect.objectContaining({
          titulo: 'Rastreabilidade de Resíduos',
          descricao: 'Sistema para rastrear resíduos sólidos industriais',
          segmento: 'Cleantech',
          servicos: ['Consultoria ESG'],
          tecnologias: ['Python'],
        }),
      )
    })

    expect(aoSalvarMock).toHaveBeenCalledWith(novaDemandaCriada)
    expect(aoFecharMock).toHaveBeenCalled()
  })

  it('deve carregar dados da demanda existente para edição e chamar atualizarDemanda', async () => {
    const demandaExistente: demandasLib.Demanda = {
      id: 'dem-existente-1',
      company_id: companyId,
      titulo: 'Demanda Antiga',
      descricao: 'Descrição antiga',
      segmento: 'Agritech',
      servicos: ['Consultoria ESG'],
      tecnologias: ['React'],
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }

    const demandaAtualizada: demandasLib.Demanda = {
      ...demandaExistente,
      titulo: 'Demanda Renovada',
      status: 'em_andamento',
    }

    vi.mocked(demandasLib.atualizarDemanda).mockResolvedValueOnce(demandaAtualizada)
    const aoSalvarMock = vi.fn()
    const aoFecharMock = vi.fn()

    render(
      <ModalNovaDemanda
        aberto={true}
        companyId={companyId}
        demandaParaEditar={demandaExistente}
        aoFechar={aoFecharMock}
        aoSalvar={aoSalvarMock}
      />,
    )

    expect(screen.getByRole('heading', { name: /editar demanda/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Demanda Antiga')).toBeInTheDocument()
    // Aguarda carregar opções do catálogo
    expect(await screen.findByRole('button', { name: 'Consultoria ESG' })).toBeInTheDocument()

    // Modifica título e status
    fireEvent.change(screen.getByLabelText(/título da demanda/i), {
      target: { value: 'Demanda Renovada' },
    })
    fireEvent.change(screen.getByLabelText(/status da demanda/i), {
      target: { value: 'em_andamento' },
    })

    // Salva alterações via submit no formulário
    fireEvent.submit(screen.getByRole('button', { name: /salvar alterações/i }).closest('form')!)

    await waitFor(() => {
      expect(demandasLib.atualizarDemanda).toHaveBeenCalledWith(
        companyId,
        'dem-existente-1',
        expect.objectContaining({
          titulo: 'Demanda Renovada',
          status: 'em_andamento',
        }),
      )
    })

    expect(aoSalvarMock).toHaveBeenCalledWith(demandaAtualizada)
    expect(aoFecharMock).toHaveBeenCalled()
  })
})

import ModalEditarTagsStartup from '@/components/dashboard-startup/ModalEditarTagsStartup.tsx'
import * as catalogos from '@/lib/catalogos.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/catalogos.ts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/catalogos.ts')>('@/lib/catalogos.ts')
  return {
    ...actual,
    buscarExpertises: vi.fn(),
    buscarServicos: vi.fn(),
    buscarTecnologias: vi.fn(),
    buscarSegmentos: vi.fn(),
    carregarTagsDetalhadasStartup: vi.fn(),
    salvarTagsStartup: vi.fn(),
  }
})

describe('ModalEditarTagsStartup', () => {
  const mockStartupId = 'startup-123'
  const aoFechar = vi.fn()
  const aoSalvarSucesso = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(catalogos.buscarExpertises).mockResolvedValue([
      { id: 'exp-1', name: 'Inteligência Artificial' },
      { id: 'exp-2', name: 'Logística Reversa' },
      { id: 'exp-outros', name: 'Outros' },
    ])
    vi.mocked(catalogos.buscarServicos).mockResolvedValue([
      { id: 'srv-1', name: 'Consultoria' },
      { id: 'srv-2', name: 'Desenvolvimento Web' },
      { id: 'srv-outros', name: 'Outros' },
    ])
    vi.mocked(catalogos.buscarTecnologias).mockResolvedValue([
      { id: 'tec-1', name: 'React' },
      { id: 'tec-2', name: 'Node.js' },
      { id: 'tec-outros', name: 'Outras' },
    ])
    vi.mocked(catalogos.buscarSegmentos).mockResolvedValue([
      { id: 'seg-1', name: 'Varejo' },
      { id: 'seg-2', name: 'Indústria' },
      { id: 'seg-outros', name: 'Outro' },
    ])

    vi.mocked(catalogos.carregarTagsDetalhadasStartup).mockResolvedValue({
      expertises: [{ id: 'exp-1', name: 'Inteligência Artificial' }],
      services: [{ id: 'srv-1', name: 'Consultoria' }],
      technologies: [{ id: 'tec-1', name: 'React' }],
      segments: [],
    })

    vi.mocked(catalogos.salvarTagsStartup).mockResolvedValue(undefined)
  })

  it('não deve renderizar nada quando aberto for false', () => {
    const { container } = render(
      <ModalEditarTagsStartup
        aberto={false}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('deve carregar e exibir os dropdowns e os itens iniciais selecionados', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    expect(screen.getByText(/Carregando catálogos e marcações…/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Editar áreas, serviços e tecnologias/i }),
      ).toBeInTheDocument()
    })

    // Área selecionada inicialmente
    const selectArea = screen.getByLabelText(/Área de atuação principal/i) as HTMLSelectElement
    expect(selectArea.value).toBe('exp-1')

    // Itens iniciais renderizados como badges
    expect(screen.getByText('Consultoria')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('deve exibir campo de texto quando Outros for selecionado na Área de atuação', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Área de atuação principal/i)).toBeInTheDocument()
    })

    const selectArea = screen.getByLabelText(/Área de atuação principal/i)
    fireEvent.change(selectArea, { target: { value: '__outros__' } })

    const inputOutraArea = screen.getByLabelText(/Especifique sua área de atuação:/i)
    expect(inputOutraArea).toBeInTheDocument()

    fireEvent.change(inputOutraArea, { target: { value: 'Biotecnologia Marinha' } })
    expect(inputOutraArea).toHaveValue('Biotecnologia Marinha')
  })

  it('deve adicionar um serviço pelo dropdown e também adicionar um serviço personalizado quando Outros for selecionado', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Serviços prestados/i)).toBeInTheDocument()
    })

    const selectServicos = screen.getByLabelText(/Serviços prestados/i)

    // 1. Adicionar Desenvolvimento Web do dropdown
    fireEvent.change(selectServicos, { target: { value: 'srv-2' } })
    const btnAdicionar = screen.getByRole('button', { name: 'Adicionar' })
    fireEvent.click(btnAdicionar)
    expect(screen.getByText('Desenvolvimento Web')).toBeInTheDocument()

    // 2. Selecionar Outros no dropdown
    fireEvent.change(selectServicos, { target: { value: '__outros__' } })

    const inputOutro = screen.getByLabelText(/Especifique o outro serviço:/i)
    expect(inputOutro).toBeInTheDocument()

    fireEvent.change(inputOutro, { target: { value: 'Chatbot com LLM' } })
    const btnAdicionarOutro = screen.getByRole('button', { name: 'Adicionar' })
    fireEvent.click(btnAdicionarOutro)

    expect(screen.getByText('Chatbot com LLM')).toBeInTheDocument()
  })

  it('deve permitir remover um item selecionado', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Consultoria')).toBeInTheDocument()
    })

    const btnRemover = screen.getByRole('button', { name: /Remover serviço Consultoria/i })
    fireEvent.click(btnRemover)

    expect(
      screen.queryByRole('button', { name: /Remover serviço Consultoria/i }),
    ).not.toBeInTheDocument()
  })

  it('deve salvar as tags selecionadas e disparar os callbacks de sucesso e fechamento', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Tecnologias e Stacks/i)).toBeInTheDocument()
    })

    // Adiciona tecnologia Node.js
    const selectTec = screen.getByLabelText(/Tecnologias e Stacks/i)
    fireEvent.change(selectTec, { target: { value: 'tec-2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    // Clica no botão Salvar
    const btnSalvar = screen.getByRole('button', { name: /^Salvar$/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(catalogos.salvarTagsStartup).toHaveBeenCalledWith(
        mockStartupId,
        {
          expertises: ['exp-1'],
          services: ['srv-1'],
          technologies: ['tec-1', 'tec-2'],
          segments: [],
        },
        {
          expertises: ['exp-1'],
          services: ['srv-1'],
          technologies: ['tec-1'],
          segments: [],
        },
      )
    })

    expect(aoSalvarSucesso).toHaveBeenCalledTimes(1)
    expect(aoFechar).toHaveBeenCalledTimes(1)
  })

  it('deve fechar ao clicar no botão de fechar ou no botão Cancelar', async () => {
    render(
      <ModalEditarTagsStartup
        aberto={true}
        startupId={mockStartupId}
        aoFechar={aoFechar}
        aoSalvarSucesso={aoSalvarSucesso}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Fechar modal/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Fechar modal/i }))
    expect(aoFechar).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(aoFechar).toHaveBeenCalledTimes(2)
  })
})

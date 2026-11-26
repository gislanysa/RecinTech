import MeuPerfilEmpresa from '@/pages/MeuPerfilEmpresa.tsx'
import * as api from '@/lib/api.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEmpresa: api.Company = {
  id: 'company-123',
  name: 'Porto Soluções Corporativas',
  email: 'contato@portosolucoes.com.br',
  size: 'medium',
  cnpj: '12345678000199',
  city: 'Recife',
  state: 'PE',
  website: 'https://portosolucoes.com.br',
  is_active: true,
  created_at: '2026-02-15T10:00:00Z',
}

const mockDefinirConta = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ conta: mockEmpresa }),
  }
})

vi.mock('@/contexts/useAuth.ts', () => ({
  useAuth: () => ({
    definirConta: mockDefinirConta,
  }),
}))

vi.mock('@/lib/api.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api.ts')>()
  return {
    ...actual,
    atualizarEmpresa: vi.fn(),
  }
})

function renderPerfil() {
  return render(
    <MemoryRouter>
      <MeuPerfilEmpresa />
    </MemoryRouter>,
  )
}

describe('MeuPerfilEmpresa - Visualização e Edição de Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza os dados cadastrais da empresa corretamente', () => {
    renderPerfil()

    expect(screen.getByRole('heading', { name: 'Meu perfil' })).toBeInTheDocument()
    expect(screen.getByText('Porto Soluções Corporativas')).toBeInTheDocument()
    expect(screen.getByText('Média — 50 a 249 colaboradores')).toBeInTheDocument()
    expect(screen.getByText('12.345.678/0001-99')).toBeInTheDocument()
    expect(screen.getByText('Recife, PE')).toBeInTheDocument()
    expect(screen.getByText('portosolucoes.com.br')).toBeInTheDocument()
    expect(screen.getByText('contato@portosolucoes.com.br')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeInTheDocument()
  })

  it('permite abrir o modal, editar os campos e salvar com sucesso', async () => {
    const empresaAtualizada: api.Company = {
      ...mockEmpresa,
      name: 'Porto Soluções Globais',
      size: 'big',
      city: 'Olinda',
      state: 'PE',
      website: 'https://portoglobais.com.br',
    }

    vi.mocked(api.atualizarEmpresa).mockResolvedValueOnce(empresaAtualizada)

    renderPerfil()

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))

    expect(screen.getByRole('heading', { name: 'Editar perfil da empresa' })).toBeInTheDocument()

    // Modifica os campos
    const inputNome = screen.getByLabelText(/Nome da empresa/i)
    fireEvent.change(inputNome, { target: { value: 'Porto Soluções Globais' } })

    const selectPorte = screen.getByLabelText(/Porte da organização/i)
    fireEvent.change(selectPorte, { target: { value: 'big' } })

    const inputCidade = screen.getByLabelText(/Cidade/i)
    fireEvent.change(inputCidade, { target: { value: 'Olinda' } })

    const inputWebsite = screen.getByLabelText(/Site \/ Website/i)
    fireEvent.change(inputWebsite, { target: { value: 'https://portoglobais.com.br' } })

    // Submete o formulário
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => {
      expect(api.atualizarEmpresa).toHaveBeenCalledWith('company-123', {
        name: 'Porto Soluções Globais',
        size: 'big',
        city: 'Olinda',
        state: 'PE',
        website: 'https://portoglobais.com.br',
      })
    })

    expect(mockDefinirConta).toHaveBeenCalledWith(empresaAtualizada)
    expect(await screen.findByText('Perfil da empresa atualizado com sucesso!')).toBeInTheDocument()
    expect(screen.getByText('Porto Soluções Globais')).toBeInTheDocument()
    expect(screen.getByText('Grande — 250 ou mais colaboradores')).toBeInTheDocument()
  })

  it('não permite salvar se o nome estiver em branco', () => {
    renderPerfil()

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))

    const inputNome = screen.getByLabelText(/Nome da empresa/i)
    fireEvent.change(inputNome, { target: { value: '   ' } })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(screen.getByText('O nome da empresa é obrigatório.')).toBeInTheDocument()
    expect(api.atualizarEmpresa).not.toHaveBeenCalled()
  })

  it('permite cancelar a edição fechando o modal sem salvar', () => {
    renderPerfil()

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))

    const inputNome = screen.getByLabelText(/Nome da empresa/i)
    fireEvent.change(inputNome, { target: { value: 'Nome Provisorio' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('heading', { name: 'Editar perfil da empresa' })).not.toBeInTheDocument()
    expect(screen.getByText('Porto Soluções Corporativas')).toBeInTheDocument()
    expect(screen.queryByText('Nome Provisorio')).not.toBeInTheDocument()
    expect(api.atualizarEmpresa).not.toHaveBeenCalled()
  })

  it('exibe mensagem de erro quando a API falhar', async () => {
    vi.mocked(api.atualizarEmpresa).mockRejectedValueOnce(new Error('Erro de servidor'))

    renderPerfil()

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(
      await screen.findByText(
        'Não foi possível salvar as alterações. Verifique seus dados e tente novamente.',
      ),
    ).toBeInTheDocument()
  })
})

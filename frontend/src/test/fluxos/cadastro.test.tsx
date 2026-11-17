import FormularioEmpresa from '@/components/signup/FormularioEmpresa.tsx'
import FormularioStartup from '@/components/signup/FormularioStartup.tsx'
import * as api from '@/lib/api.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api.ts')>()
  return {
    ...mod,
    registrarStartup: vi.fn(),
    registrarEmpresa: vi.fn(),
  }
})

describe('Fluxo de Cadastro - Startup e Empresa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cadastro de Startup', () => {
    it('deve validar campos obrigatórios ao submeter formulário em branco', async () => {
      render(
        <MemoryRouter>
          <FormularioStartup onVoltar={vi.fn()} />
        </MemoryRouter>,
      )

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(await screen.findByText('Informe o nome da startup.')).toBeInTheDocument()
      expect(await screen.findByText('Selecione o estágio.')).toBeInTheDocument()
      expect(await screen.findByText('Informe o CNPJ.')).toBeInTheDocument()
      expect(api.registrarStartup).not.toHaveBeenCalled()
    })

    it('deve submeter o cadastro da startup com sucesso chamando registrarStartup', async () => {
      vi.mocked(api.registrarStartup).mockResolvedValueOnce({
        id: 'new-startup-1',
        name: 'EcoLog Tech',
        email: 'ecolog@tech.com',
        stage: 'traction',
        cnpj: '12345678000190',
        description: 'Solução verde',
        city: 'Recife',
        state: 'PE',
        website: 'https://ecolog.tech',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      })

      render(
        <MemoryRouter initialEntries={['/cadastro/startup']}>
          <Routes>
            <Route path="/cadastro/startup" element={<FormularioStartup onVoltar={vi.fn()} />} />
            <Route path="/entrar" element={<div>Tela de Login</div>} />
          </Routes>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/nome da startup/i), {
        target: { value: 'EcoLog Tech' },
      })
      fireEvent.change(screen.getByLabelText(/cnpj/i), {
        target: { value: '12.345.678/0001-90' },
      })
      fireEvent.change(screen.getByLabelText(/estágio/i), {
        target: { value: 'traction' },
      })
      fireEvent.change(screen.getByLabelText(/cidade/i), {
        target: { value: 'Recife' },
      })
      fireEvent.change(screen.getByLabelText(/^estado/i), {
        target: { value: 'PE' },
      })
      fireEvent.change(screen.getByLabelText(/^e-mail/i), {
        target: { value: 'ecolog@tech.com' },
      })
      fireEvent.change(screen.getByLabelText(/^senha/i), {
        target: { value: 'senhaForte123' },
      })
      fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
        target: { value: 'senhaForte123' },
      })

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      await waitFor(() => {
        expect(api.registrarStartup).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'EcoLog Tech',
            cnpj: '12.345.678/0001-90',
            stage: 'traction',
            city: 'Recife',
            state: 'PE',
            email: 'ecolog@tech.com',
            password: 'senhaForte123',
          }),
        )
      })

      expect(await screen.findByText('Tela de Login')).toBeInTheDocument()
    })
  })

  describe('Cadastro de Empresa', () => {
    it('deve validar campos obrigatórios ao submeter formulário em branco', async () => {
      render(
        <MemoryRouter>
          <FormularioEmpresa onVoltar={vi.fn()} />
        </MemoryRouter>,
      )

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(await screen.findByText('Informe o nome da empresa.')).toBeInTheDocument()
      expect(await screen.findByText('Selecione o tamanho.')).toBeInTheDocument()
      expect(await screen.findByText('Informe o CNPJ.')).toBeInTheDocument()
      expect(api.registrarEmpresa).not.toHaveBeenCalled()
    })

    it('deve submeter o cadastro da empresa com sucesso chamando registrarEmpresa', async () => {
      vi.mocked(api.registrarEmpresa).mockResolvedValueOnce({
        id: 'new-company-1',
      })

      render(
        <MemoryRouter initialEntries={['/cadastro/empresa']}>
          <Routes>
            <Route path="/cadastro/empresa" element={<FormularioEmpresa onVoltar={vi.fn()} />} />
            <Route path="/entrar" element={<div>Tela de Login</div>} />
          </Routes>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/nome da empresa/i), {
        target: { value: 'Indústria Nordeste' },
      })
      fireEvent.change(screen.getByLabelText(/cnpj/i), {
        target: { value: '98.765.432/0001-00' },
      })
      fireEvent.change(screen.getByLabelText(/tamanho/i), {
        target: { value: 'medium' },
      })
      fireEvent.change(screen.getByLabelText(/cidade/i), {
        target: { value: 'Recife' },
      })
      fireEvent.change(screen.getByLabelText(/^estado/i), {
        target: { value: 'PE' },
      })
      fireEvent.change(screen.getByLabelText(/e-mail corporativo/i), {
        target: { value: 'contato@nordeste.com' },
      })
      fireEvent.change(screen.getByLabelText(/^senha/i), {
        target: { value: 'senhaSegura123' },
      })
      fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
        target: { value: 'senhaSegura123' },
      })

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      await waitFor(() => {
        expect(api.registrarEmpresa).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Indústria Nordeste',
            cnpj: '98.765.432/0001-00',
            size: 'medium',
            city: 'Recife',
            state: 'PE',
            email: 'contato@nordeste.com',
            password: 'senhaSegura123',
          }),
        )
      })

      expect(await screen.findByText('Tela de Login')).toBeInTheDocument()
    })
  })
})

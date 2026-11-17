import FormularioLogin from '@/components/login/FormularioLogin.tsx'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import * as api from '@/lib/api.ts'
import axios from 'axios'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api.ts')>()
  return {
    ...mod,
    login: vi.fn(),
    logout: vi.fn(),
    restaurarSessao: vi.fn().mockResolvedValue(null),
  }
})

describe('Fluxo de Login - FormularioLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.restaurarSessao).mockResolvedValue(null)
  })

  function renderizarLogin(initialEntries = ['/entrar']) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Routes>
            <Route path="/entrar" element={<FormularioLogin />} />
            <Route path="/dashboard/startup" element={<div>Dashboard Startup</div>} />
            <Route path="/dashboard/empresa" element={<div>Dashboard Empresa</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
  }

  it('deve renderizar os campos de email, senha e alternador de perfil', () => {
    renderizarLogin()

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /startup/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /empresa/i })).toBeInTheDocument()
  })

  it('deve validar e exibir erros quando submetido com campos vazios', async () => {
    renderizarLogin()

    const botaoEntrar = screen.getByRole('button', { name: /^entrar$/i })
    fireEvent.click(botaoEntrar)

    expect(await screen.findByText('E-mail obrigatório.')).toBeInTheDocument()
    expect(await screen.findByText('Senha obrigatória.')).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })

  it('deve logar com sucesso como Startup e navegar para /dashboard/startup', async () => {
    const startupMock: api.Startup = {
      id: 'startup-123',
      name: 'BioTech Inovações',
      email: 'contato@biotech.com',
      stage: 'traction',
      cnpj: '12345678000190',
      description: 'Startup biotecnologia',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.login).mockReset()
    vi.mocked(api.login).mockResolvedValue(startupMock)

    renderizarLogin()

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'contato@biotech.com' },
    })
    fireEvent.change(screen.getByLabelText(/^senha/i), {
      target: { value: 'senha12345' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('contato@biotech.com', 'senha12345', 'startup')
    })
    expect(await screen.findByText('Dashboard Startup')).toBeInTheDocument()
  })

  it('deve logar com sucesso como Empresa ao alternar perfil e navegar para /dashboard/empresa', async () => {
    const empresaMock: api.Company = {
      id: 'empresa-456',
      name: 'Indústria Solar',
      email: 'contato@solar.com',
      size: 'medium',
      cnpj: '98765432000100',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.login).mockReset()
    vi.mocked(api.login).mockResolvedValue(empresaMock)

    renderizarLogin()

    // Alterna para perfil Empresa
    fireEvent.click(screen.getByRole('radio', { name: /empresa/i }))

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'contato@solar.com' },
    })
    fireEvent.change(screen.getByLabelText(/^senha/i), {
      target: { value: 'senha12345' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('contato@solar.com', 'senha12345', 'company')
    })
    expect(await screen.findByText('Dashboard Empresa')).toBeInTheDocument()
  })

  it('deve exibir mensagem de erro amigável ao receber 401 (credenciais incorretas)', async () => {
    const erro401 = new axios.AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        statusText: 'Unauthorized',
        data: 'Wrong email or password',
        headers: {},
        config: {} as any,
      },
    )

    vi.mocked(api.login).mockReset()
    vi.mocked(api.login).mockRejectedValue(erro401)

    renderizarLogin()

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'errado@email.com' },
    })
    fireEvent.change(screen.getByLabelText(/^senha/i), {
      target: { value: 'senhaerrada' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(
      await screen.findByText('E-mail ou senha incorretos para o tipo de conta selecionado.'),
    ).toBeInTheDocument()
  })
})

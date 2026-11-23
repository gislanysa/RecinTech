import FormularioEmpresa from '@/components/signup/FormularioEmpresa.tsx'
import FormularioStartup from '@/components/signup/FormularioStartup.tsx'
import { AuthProvider } from '@/contexts/AuthContext.tsx'
import * as api from '@/lib/api.ts'
import * as lgpd from '@/lib/lgpd.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/api.ts')>()
  return {
    ...mod,
    registrarStartup: vi.fn(),
    registrarEmpresa: vi.fn(),
    login: vi.fn(),
  }
})

// O cadastro entra na conta recem-criada para gravar o consentimento, porque
// essa rota exige sessao. Sem servidor no teste as duas chamadas falhariam e o
// formulario cairia no caminho alternativo, o login. Mockando as duas, o que o
// teste verifica e o caminho principal: ir direto ao painel.
vi.mock('@/lib/lgpd.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/lgpd.ts')>()
  return {
    ...mod,
    concederConsentimento: vi.fn(),
  }
})

const STARTUP: api.Startup = {
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
}

const EMPRESA: api.Company = {
  id: 'new-company-1',
  name: 'Indústria Nordeste',
  email: 'contato@nordeste.com',
  size: 'medium',
  cnpj: '98765432000100',
  city: 'Recife',
  state: 'PE',
  website: '',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

describe('Fluxo de Cadastro - Startup e Empresa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cadastro de Startup', () => {
    it('deve validar campos obrigatórios ao submeter formulário em branco', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <FormularioStartup onVoltar={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(await screen.findByText('Informe o nome da startup.')).toBeInTheDocument()
      expect(await screen.findByText('Selecione o estágio.')).toBeInTheDocument()
      expect(await screen.findByText('Informe o CNPJ.')).toBeInTheDocument()
      expect(api.registrarStartup).not.toHaveBeenCalled()
    })

    it('não deve submeter sem o aceite da política de privacidade', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <FormularioStartup onVoltar={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>,
      )

      preencherStartup()

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(
        await screen.findByText(/para criar a conta, e preciso aceitar a politica e os termos/i),
      ).toBeInTheDocument()
      expect(api.registrarStartup).not.toHaveBeenCalled()
    })

    it('deve submeter o cadastro da startup com sucesso e ir para o painel', async () => {
      vi.mocked(api.registrarStartup).mockResolvedValueOnce(STARTUP)
      vi.mocked(api.login).mockResolvedValueOnce(STARTUP)
      vi.mocked(lgpd.concederConsentimento).mockResolvedValueOnce({
        type: 'granted',
        version: 1,
        updated_at: '2026-01-01T00:00:00Z',
      })

      render(
        <MemoryRouter initialEntries={['/cadastro/startup']}>
          <AuthProvider>
            <Routes>
              <Route path="/cadastro/startup" element={<FormularioStartup onVoltar={vi.fn()} />} />
              <Route path="/dashboard/startup" element={<div>Painel da Startup</div>} />
              <Route path="/entrar" element={<div>Tela de Login</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      preencherStartup()
      fireEvent.click(screen.getByLabelText(/li e concordo com a/i))

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

      // O consentimento e gravado para a conta recem-criada, nao para outra.
      await waitFor(() => {
        expect(lgpd.concederConsentimento).toHaveBeenCalledWith('startup', STARTUP.id)
      })

      expect(await screen.findByText('Painel da Startup')).toBeInTheDocument()
    })
  })

  describe('Cadastro de Empresa', () => {
    it('deve validar campos obrigatórios ao submeter formulário em branco', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <FormularioEmpresa onVoltar={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(await screen.findByText('Informe o nome da empresa.')).toBeInTheDocument()
      expect(await screen.findByText('Selecione o tamanho.')).toBeInTheDocument()
      expect(await screen.findByText('Informe o CNPJ.')).toBeInTheDocument()
      expect(api.registrarEmpresa).not.toHaveBeenCalled()
    })

    it('não deve submeter sem o aceite da política de privacidade', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <FormularioEmpresa onVoltar={vi.fn()} />
          </AuthProvider>
        </MemoryRouter>,
      )

      preencherEmpresa()

      fireEvent.submit(screen.getByRole('button', { name: /criar minha conta/i }).closest('form')!)

      expect(
        await screen.findByText(/para criar a conta, e preciso aceitar a politica e os termos/i),
      ).toBeInTheDocument()
      expect(api.registrarEmpresa).not.toHaveBeenCalled()
    })

    it('deve submeter o cadastro da empresa com sucesso e ir para o painel', async () => {
      vi.mocked(api.registrarEmpresa).mockResolvedValueOnce({ id: EMPRESA.id })
      vi.mocked(api.login).mockResolvedValueOnce(EMPRESA)
      vi.mocked(lgpd.concederConsentimento).mockResolvedValueOnce({
        type: 'granted',
        version: 1,
        updated_at: '2026-01-01T00:00:00Z',
      })

      render(
        <MemoryRouter initialEntries={['/cadastro/empresa']}>
          <AuthProvider>
            <Routes>
              <Route path="/cadastro/empresa" element={<FormularioEmpresa onVoltar={vi.fn()} />} />
              <Route path="/dashboard/empresa" element={<div>Painel da Empresa</div>} />
              <Route path="/entrar" element={<div>Tela de Login</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      preencherEmpresa()
      fireEvent.click(screen.getByLabelText(/li e concordo com a/i))

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

      await waitFor(() => {
        expect(lgpd.concederConsentimento).toHaveBeenCalledWith('company', EMPRESA.id)
      })

      expect(await screen.findByText('Painel da Empresa')).toBeInTheDocument()
    })
  })
})

/** Preenche todos os campos obrigatórios do cadastro de startup. */
function preencherStartup() {
  fireEvent.change(screen.getByLabelText(/nome da startup/i), {
    target: { value: 'EcoLog Tech' },
  })
  fireEvent.change(screen.getByLabelText(/cnpj/i), {
    target: { value: '12.345.678/0001-90' },
  })
  fireEvent.change(screen.getByLabelText(/estágio/i), {
    target: { value: 'traction' },
  })
  fireEvent.change(screen.getByLabelText(/^cidade/i), {
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
}

/** Preenche todos os campos obrigatórios do cadastro de empresa. */
function preencherEmpresa() {
  fireEvent.change(screen.getByLabelText(/nome da empresa/i), {
    target: { value: 'Indústria Nordeste' },
  })
  fireEvent.change(screen.getByLabelText(/cnpj/i), {
    target: { value: '98.765.432/0001-00' },
  })
  fireEvent.change(screen.getByLabelText(/tamanho/i), {
    target: { value: 'medium' },
  })
  fireEvent.change(screen.getByLabelText(/^cidade/i), {
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
}

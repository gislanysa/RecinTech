import { AuthProvider } from '@/contexts/AuthContext.tsx'
import { useAuth } from '@/contexts/useAuth.ts'
import * as api from '@/lib/api.ts'
import { act, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  restaurarSessao: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  tipoDaConta: vi.fn(),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve disparar erro quando useAuth for usado fora de AuthProvider', () => {
    // Silencia o console.error do React para o erro esperado
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser utilizado dentro de um <AuthProvider>',
    )

    consoleError.mockRestore()
  })

  it('deve restaurar sessão autenticada com sucesso ao montar', async () => {
    const usuarioMock: api.ContaLogada = {
      id: 'empresa-123',
      name: 'Eco Indústria',
      email: 'contato@eco.com',
      cnpj: '12345678000190',
      size: 'medium',
      description: 'Indústria sustentável',
      city: 'Recife',
      state: 'PE',
      website: 'https://eco.com',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(usuarioMock)
    vi.mocked(api.tipoDaConta).mockReturnValueOnce('company')

    function ComponenteConsumidor() {
      const { estado, conta, tipoConta } = useAuth()
      return (
        <div>
          <span data-testid="estado">{estado}</span>
          <span data-testid="nome">{conta?.name}</span>
          <span data-testid="tipo">{tipoConta}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <ComponenteConsumidor />
      </AuthProvider>,
    )

    // Aguarda resolução da promise de restaurar sessão
    expect(await screen.findByText('Eco Indústria')).toBeInTheDocument()
    expect(screen.getByTestId('estado')).toHaveTextContent('autenticado')
    expect(screen.getByTestId('tipo')).toHaveTextContent('company')
  })

  it('deve marcar estado como nao-autenticado quando restaurarSessao retornar null', async () => {
    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(null)
    vi.mocked(api.tipoDaConta).mockReturnValueOnce(null)

    function ComponenteConsumidor() {
      const { estado, conta } = useAuth()
      return (
        <div>
          <span data-testid="estado">{estado}</span>
          <span data-testid="conta">{conta ? 'logado' : 'deslogado'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <ComponenteConsumidor />
      </AuthProvider>,
    )

    expect(await screen.findByText('deslogado')).toBeInTheDocument()
    expect(screen.getByTestId('estado')).toHaveTextContent('nao-autenticado')
  })

  it('deve atualizar o estado ao realizar login e logout com sucesso', async () => {
    vi.mocked(api.restaurarSessao).mockResolvedValueOnce(null)
    vi.mocked(api.tipoDaConta).mockReturnValue(null)

    const startupMock: api.ContaLogada = {
      id: 'startup-1',
      name: 'BioTech',
      email: 'bio@tech.com',
      cnpj: '98765432000110',
      stage: 'traction',
      description: 'Biotecnologia',
      city: 'Recife',
      state: 'PE',
      website: '',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })

    // Aguarda montagem inicial
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.estado).toBe('nao-autenticado')

    // Executa login
    vi.mocked(api.login).mockResolvedValueOnce(startupMock)
    vi.mocked(api.tipoDaConta).mockReturnValueOnce('startup')

    await act(async () => {
      await result.current.login('bio@tech.com', 'senha123', 'startup')
    })

    expect(result.current.estado).toBe('autenticado')
    expect(result.current.conta?.name).toBe('BioTech')
    expect(result.current.tipoConta).toBe('startup')

    // Executa logout
    vi.mocked(api.logout).mockResolvedValueOnce()

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.estado).toBe('nao-autenticado')
    expect(result.current.conta).toBeNull()
    expect(result.current.tipoConta).toBeNull()
  })
})

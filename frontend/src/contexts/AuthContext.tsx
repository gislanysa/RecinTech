import {
  AuthContext,
  type AuthContextTipo,
  type EstadoAutenticacao,
} from './authContextDef.ts'
import {
  login as apiLogin,
  logout as apiLogout,
  restaurarSessao,
  tipoDaConta,
  type ContaLogada,
  type TipoSessao,
} from '@/lib/api.ts'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type { AuthContextTipo, EstadoAutenticacao }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<ContaLogada | null>(null)
  const [tipoConta, setTipoConta] = useState<TipoSessao | null>(null)
  const [estado, setEstado] = useState<EstadoAutenticacao>('carregando')

  const definirConta = useCallback((novaConta: ContaLogada | null) => {
    setConta(novaConta)
    setTipoConta(tipoDaConta(novaConta))
    setEstado(novaConta ? 'autenticado' : 'nao-autenticado')
  }, [])

  const recarregarSessao = useCallback(async (): Promise<ContaLogada | null> => {
    try {
      const usuario = await restaurarSessao()
      definirConta(usuario)
      return usuario
    } catch {
      definirConta(null)
      return null
    }
  }, [definirConta])

  useEffect(() => {
    let ativo = true
    restaurarSessao().then((usuario) => {
      if (!ativo) return
      definirConta(usuario)
    })
    return () => {
      ativo = false
    }
  }, [definirConta])

  const login = useCallback(
    async (email: string, senha: string, tipo: TipoSessao = 'startup'): Promise<ContaLogada> => {
      const novaConta = await apiLogin(email, senha, tipo)
      definirConta(novaConta)
      return novaConta
    },
    [definirConta],
  )

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout()
    } finally {
      definirConta(null)
    }
  }, [definirConta])

  const valor = useMemo<AuthContextTipo>(
    () => ({
      conta,
      tipoConta,
      estado,
      login,
      logout,
      recarregarSessao,
      definirConta,
    }),
    [conta, tipoConta, estado, login, logout, recarregarSessao, definirConta],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

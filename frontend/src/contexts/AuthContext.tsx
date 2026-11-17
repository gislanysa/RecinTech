import {
  AuthContext,
  type AuthContextTipo,
  type EstadoAutenticacao,
} from './authContextDef.ts'
import {
  login as apiLogin,
  logout as apiLogout,
  restaurarSessao,
  renovarSessao,
  aoExpirarSessao,
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

/** Intervalo para renovação periódica da sessão (15 minutos = 900.000 ms) */
const INTERVALO_REFRESH_MS = 15 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<ContaLogada | null>(null)
  const [tipoConta, setTipoConta] = useState<TipoSessao | null>(null)
  const [estado, setEstado] = useState<EstadoAutenticacao>('carregando')
  const [erroTemporario, setErroTemporario] = useState<string | null>(null)

  const definirConta = useCallback((novaConta: ContaLogada | null) => {
    setConta(novaConta)
    setTipoConta(tipoDaConta(novaConta))
    setEstado(novaConta ? 'autenticado' : 'nao-autenticado')
    if (novaConta) {
      setErroTemporario(null)
    }
  }, [])

  // Listener para quando o interceptor detectar 401 em rotas protegidas
  useEffect(() => {
    if (typeof aoExpirarSessao === 'function') {
      const desinscrever = aoExpirarSessao(() => {
        definirConta(null)
      })
      return desinscrever
    }
  }, [definirConta])

  // Renovação periódica do token de sessão (/auth/refresh) enquanto autenticado
  useEffect(() => {
    if (estado !== 'autenticado') return

    const timer = setInterval(() => {
      if (typeof renovarSessao === 'function') {
        void renovarSessao()
      }
    }, INTERVALO_REFRESH_MS)

    return () => {
      clearInterval(timer)
    }
  }, [estado])

  const recarregarSessao = useCallback(async (): Promise<ContaLogada | null> => {
    setEstado('carregando')
    try {
      const usuario = await restaurarSessao()
      setErroTemporario(null)
      definirConta(usuario)
      return usuario
    } catch {
      // Erro de rede ou 500: falha temporária sem deslogar
      setEstado('erro-temporario')
      setErroTemporario('Falha de conexão com o servidor. Verifique sua rede e tente novamente.')
      return null
    }
  }, [definirConta])

  useEffect(() => {
    let ativo = true
    restaurarSessao()
      .then((usuario) => {
        if (!ativo) return
        setErroTemporario(null)
        definirConta(usuario)
      })
      .catch(() => {
        if (!ativo) return
        // Em erro de rede ou 500, NÃO desloga para nao-autenticado: exibe estado transitório
        setEstado('erro-temporario')
        setErroTemporario('Falha de conexão com o servidor. Verifique sua rede e tente novamente.')
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
      erroTemporario,
      login,
      logout,
      recarregarSessao,
      definirConta,
    }),
    [conta, tipoConta, estado, erroTemporario, login, logout, recarregarSessao, definirConta],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

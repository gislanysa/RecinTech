import type { ContaLogada, TipoSessao } from '@/lib/api.ts'
import { createContext } from 'react'

export type EstadoAutenticacao = 'carregando' | 'autenticado' | 'nao-autenticado'

export type AuthContextTipo = {
  conta: ContaLogada | null
  tipoConta: TipoSessao | null
  estado: EstadoAutenticacao
  login: (email: string, senha: string, tipo?: TipoSessao) => Promise<ContaLogada>
  logout: () => Promise<void>
  recarregarSessao: () => Promise<ContaLogada | null>
  definirConta: (conta: ContaLogada | null) => void
}

export const AuthContext = createContext<AuthContextTipo | undefined>(undefined)

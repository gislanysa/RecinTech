import { useContext } from 'react'
import { AuthContext, type AuthContextTipo } from './authContextDef.ts'

export function useAuth(): AuthContextTipo {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>')
  }
  return contexto
}

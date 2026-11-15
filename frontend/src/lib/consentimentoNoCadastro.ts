import type { ContaLogada, TipoSessao } from '@/lib/api.ts'
import { concederConsentimento } from '@/lib/lgpd.ts'

/**
 * Registra o consentimento logo depois do cadastro.
 *
 * A rota de consentimento exige sessão e que ela seja da própria conta, mas
 * o cadastro não deixa ninguém logado: ele manda para a tela de login. Por
 * isso aqui entramos na conta recém-criada antes de registrar.
 *
 * Nada disso pode impedir o cadastro de se concluir. Se o login ou o registro
 * falhar, a pessoa segue para a tela de login como antes e o consentimento
 * fica pendente, visível em "Seus dados". A caixa marcada no formulário é o
 * ato de consentir; isto aqui é só a gravação dele.
 *
 * Devolve a conta quando conseguiu entrar, ou `null` quando não conseguiu, e
 * é isso que diz ao formulário se ele pode ir direto ao painel.
 */
export async function registrarConsentimentoDoCadastro({
  entrar,
  email,
  senha,
  tipo,
}: {
  entrar: (email: string, senha: string, tipo?: TipoSessao) => Promise<ContaLogada>
  email: string
  senha: string
  tipo: TipoSessao
}): Promise<ContaLogada | null> {
  try {
    const conta = await entrar(email, senha, tipo)
    await concederConsentimento(tipo, conta.id)
    return conta
  } catch {
    return null
  }
}

import { useAuth } from '@/contexts/useAuth.ts'
import type { TipoSessao } from '@/lib/api.ts'
import { registrarConsentimentoDoCadastro } from '@/lib/consentimentoNoCadastro.ts'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MENSAGEM_DE_ERRO = 'Para criar a conta, e preciso aceitar a politica e os termos.'

/** Para onde cada tipo de conta vai depois de se cadastrar e entrar. */
const PAINEL: Record<TipoSessao, string> = {
  startup: '/dashboard/startup',
  company: '/dashboard/empresa',
  admin: '/dashboard/admin',
}

/**
 * O aceite da política no cadastro, para os dois formulários.
 *
 * Startup e empresa fazem exatamente a mesma coisa aqui, mudando só o tipo
 * de conta e o painel de destino, então o que era repetido nos dois arquivos
 * vive neste hook.
 *
 * A caixa de aceite fica fora dos campos do formulário porque não é dado do
 * cadastro: é o ato de consentir, registrado no backend por rota própria.
 */
export function useAceiteDaPolitica(tipo: TipoSessao) {
  const [aceitou, setAceitou] = useState(false)
  const [erro, setErro] = useState('')
  const { login: entrar } = useAuth()
  const navigate = useNavigate()

  /** Mostra o erro quando a caixa está desmarcada. Devolve se pode seguir. */
  function validar(): boolean {
    setErro(aceitou ? '' : MENSAGEM_DE_ERRO)
    return aceitou
  }

  /**
   * Grava o consentimento e leva a pessoa ao destino certo: o painel quando
   * deu para entrar na conta recém-criada, ou o login quando não deu.
   *
   * Nada aqui pode impedir o cadastro de se concluir. A caixa marcada no
   * formulário é o ato de consentir; isto é só a gravação dele, e se falhar o
   * consentimento fica pendente e visível em "Seus dados".
   */
  async function concluir(email: string, senha: string): Promise<void> {
    const conta = await registrarConsentimentoDoCadastro({ entrar, email, senha, tipo })

    if (conta) {
      navigate(PAINEL[tipo])
      return
    }

    navigate('/entrar', {
      state: {
        mensagemSucesso: 'Cadastro realizado com sucesso! Faça login para continuar.',
        tipo,
        email,
      },
    })
  }

  /** O que a caixa de aceite precisa receber, pronto para espalhar com `...`. */
  const caixa = {
    id: `aceite-${tipo}`,
    marcado: aceitou,
    onChange: (valor: boolean) => {
      setAceitou(valor)
      if (valor) setErro('')
    },
    erro,
  }

  return { validar, concluir, caixa }
}

import Botao from '@/components/Botao.tsx'
import { AlertIcon, CheckIcon } from '@/components/icons.tsx'
import PaginaLegal, { ListaLegal, SecaoLegal } from '@/components/layout/PaginaLegal.tsx'
import { tipoDaConta, type ContaLogada } from '@/lib/api.ts'
import {
  concederConsentimento,
  consultarConsentimento,
  revogarConsentimento,
  type SituacaoDoConsentimento,
} from '@/lib/lgpd.ts'
import { useAuth } from '@/contexts/useAuth.ts'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function formatarData(iso?: string): string {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

type Carga =
  | { estado: 'carregando' }
  | { estado: 'erro' }
  | { estado: 'ok'; situacao: SituacaoDoConsentimento }

/**
 * "Seus dados": onde a pessoa vê e controla o consentimento.
 *
 * A página é aberta a quem não tem conta, porque o rodapé a oferece a
 * qualquer visitante e ela também explica os direitos. O que exige sessão é
 * só o bloco de consentimento, que sem conta não tem o que mostrar.
 */
export default function SeusDados() {
  const { conta, estado: sessao } = useAuth()

  return (
    <PaginaLegal
      titulo="Seus dados"
      resumo="Veja o que a plataforma guarda sobre você, controle seu consentimento e saiba como exercer os seus direitos."
    >
      {sessao === 'autenticado' && conta ? (
        <BlocoDeConsentimento conta={conta} />
      ) : (
        <SecaoLegal titulo="Consentimento">
          <p>
            Entre na sua conta para ver e alterar o seu consentimento. Sem sessão, não temos como
            saber de quem são os dados.
          </p>
          <div className="mt-2">
            <Botao to="/entrar">Entrar na minha conta</Botao>
          </div>
        </SecaoLegal>
      )}

      <SecaoLegal titulo="O que guardamos sobre você">
        <p>
          A lista completa, campo por campo, está na{' '}
          <Link
            to="/privacidade"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            política de privacidade
          </Link>
          . Em resumo: os dados do cadastro, as marcações de área, serviço, tecnologia e segmento,
          e o conteúdo que você escreveu no perfil ou nas necessidades.
        </p>
        <p>
          Sua senha não está guardada em lugar nenhum de forma legível. O que existe é um hash, e
          nem a equipe do projeto consegue voltar dele para a senha original.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="Seus direitos">
        <ListaLegal
          itens={[
            'Confirmar que tratamos seus dados e acessá-los',
            'Corrigir o que estiver errado ou desatualizado',
            'Pedir a exclusão dos dados e da conta',
            'Revogar o consentimento, o que você faz nesta página',
            'Saber com quem compartilhamos, que hoje é ninguém fora da plataforma',
          ]}
        />
        <p>
          A correção dos dados do cadastro já pode ser feita por você, em Meu perfil. A exportação
          e a exclusão da conta ainda não existem como botão: peça pelo repositório do projeto e a
          equipe atende manualmente.
        </p>
      </SecaoLegal>
    </PaginaLegal>
  )
}

function BlocoDeConsentimento({ conta }: { conta: ContaLogada }) {
  const tipo = tipoDaConta(conta)
  const [carga, setCarga] = useState<Carga>({ estado: 'carregando' })
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!tipo) return
    let ativo = true

    consultarConsentimento(tipo, conta.id)
      .then((situacao) => {
        if (ativo) setCarga({ estado: 'ok', situacao })
      })
      .catch(() => {
        if (ativo) setCarga({ estado: 'erro' })
      })

    return () => {
      ativo = false
    }
  }, [tipo, conta.id])

  async function alternar(conceder: boolean) {
    if (!tipo || enviando) return
    setEnviando(true)
    setAviso(null)

    try {
      if (conceder) {
        await concederConsentimento(tipo, conta.id)
      } else {
        await revogarConsentimento(tipo, conta.id)
      }
      setCarga({ estado: 'ok', situacao: await consultarConsentimento(tipo, conta.id) })
      setAviso(conceder ? 'Consentimento registrado.' : 'Consentimento revogado.')
    } catch {
      setAviso('Não foi possível concluir. Tente novamente em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  if (carga.estado === 'carregando') {
    return (
      <section aria-busy="true" className="h-40 animate-pulse rounded-card bg-brand-100" />
    )
  }

  if (carga.estado === 'erro') {
    return (
      <SecaoLegal titulo="Consentimento">
        <p>Não foi possível consultar o seu consentimento agora. Recarregue a página.</p>
      </SecaoLegal>
    )
  }

  const { concedido, atualizadoEm } = carga.situacao

  return (
    <section
      className={[
        'rounded-card border p-6',
        concedido ? 'border-brand-200 bg-surface-2' : 'border-accent-300 bg-accent-100',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {concedido ? (
          <CheckIcon className="mt-1 size-5 shrink-0 text-brand-600" />
        ) : (
          <AlertIcon className="mt-1 size-5 shrink-0 text-accent-700" />
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            {concedido ? 'Você autorizou o tratamento dos seus dados' : 'Falta o seu consentimento'}
          </h2>
          <p className="mt-2 leading-relaxed text-ink-700">
            {concedido
              ? `Autorização registrada${atualizadoEm ? ` em ${formatarData(atualizadoEm)}` : ''}. Você pode revogar quando quiser, sem precisar justificar.`
              : 'A plataforma guarda dados da sua conta e precisa da sua autorização explícita para isso. Enquanto você não autorizar, o tratamento segue sem a base legal do consentimento.'}
          </p>
        </div>
      </div>

      {!concedido && (
        <p className="mt-4 leading-relaxed text-ink-700">
          Ao autorizar, você declara que leu a{' '}
          <Link
            to="/privacidade"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            política de privacidade
          </Link>{' '}
          e concorda com o tratamento descrito nela.
        </p>
      )}

      {concedido && (
        <p className="mt-4 text-sm leading-relaxed text-ink-500">
          Revogar não apaga sua conta nem seus dados. Significa que você retira a autorização, e a
          equipe precisa parar o tratamento que depende dela. Para apagar de vez, peça a exclusão
          da conta.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Botao disabled={enviando} onClick={() => alternar(!concedido)}>
          {enviando
            ? 'Enviando…'
            : concedido
              ? 'Revogar meu consentimento'
              : 'Autorizar o tratamento'}
        </Botao>

        {aviso && (
          <p role="status" className="text-sm font-medium text-ink-700">
            {aviso}
          </p>
        )}
      </div>
    </section>
  )
}

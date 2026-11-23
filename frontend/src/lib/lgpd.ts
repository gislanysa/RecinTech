import { api, type TipoSessao } from '@/lib/api.ts'
import { VERSAO_DA_POLITICA } from '@/lib/politica.ts'

/**
 * Consentimento LGPD.
 *
 * O backend guarda um registro por versão de política, então o histórico fica
 * preservado: conceder e depois revogar não apaga o que aconteceu antes.
 *
 * Rotas, iguais para startup e empresa trocando o prefixo:
 *   GET    /api/<tipo>/:id/lgpd            histórico, aberto
 *   POST   /api/<tipo>/:id/lgpd/:versao    concede, exige a propria sessao
 *   DELETE /api/<tipo>/:id/lgpd/:versao    revoga, exige a propria sessao
 *
 * A versão enviada precisa ser a vigente no banco. O backend recusa versão
 * diferente, e não há rota para perguntar qual é, então o número vem de
 * `politica.ts` e os dois lados precisam andar juntos.
 */
export type TipoDeConsentimento = 'granted' | 'revoked'

export type Consentimento = {
  type: TipoDeConsentimento
  version: number
  updated_at: string
}

/** O que a tela precisa saber para decidir o que mostrar. */
export type SituacaoDoConsentimento = {
  /** `true` quando há consentimento concedido na versão vigente. */
  concedido: boolean
  /** Quando foi a última mudança nesta versão, se houve alguma. */
  atualizadoEm?: string
  /** Todo o histórico, incluindo versões antigas. */
  historico: Consentimento[]
}

function caminho(tipo: TipoSessao, id: string): string {
  return `/${tipo}/${id}/lgpd`
}

export async function consultarConsentimento(
  tipo: TipoSessao,
  id: string,
): Promise<SituacaoDoConsentimento> {
  const { data } = await api.get<Consentimento[]>(caminho(tipo, id))
  const historico = data ?? []
  const atual = historico.find((c) => c.version === VERSAO_DA_POLITICA)

  return {
    concedido: atual?.type === 'granted',
    atualizadoEm: atual?.updated_at,
    historico,
  }
}

export async function concederConsentimento(
  tipo: TipoSessao,
  id: string,
): Promise<Consentimento> {
  const { data } = await api.post<Consentimento>(
    `${caminho(tipo, id)}/${VERSAO_DA_POLITICA}`,
  )
  return data
}

export async function revogarConsentimento(
  tipo: TipoSessao,
  id: string,
): Promise<Consentimento> {
  const { data } = await api.delete<Consentimento>(
    `${caminho(tipo, id)}/${VERSAO_DA_POLITICA}`,
  )
  return data
}

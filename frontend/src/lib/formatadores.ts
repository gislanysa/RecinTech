/**
 * Utilitários para formatação e apresentação de dados no frontend.
 */

/**
 * Calcula o tempo aproximado desde o cadastro da entidade (startup, empresa) na plataforma.
 */
export function calcularTempoAtuacao(dataCriacao?: string | null): string {
  if (!dataCriacao) return 'Tempo na plataforma não informado'

  try {
    const criacao = new Date(dataCriacao)
    if (isNaN(criacao.getTime())) {
      return 'Tempo na plataforma não informado'
    }
    const agora = new Date()
    const diffMeses =
      (agora.getFullYear() - criacao.getFullYear()) * 12 +
      (agora.getMonth() - criacao.getMonth())

    if (diffMeses <= 1) return 'Recém-chegada na plataforma'
    if (diffMeses < 12) return `${diffMeses} meses na plataforma`
    const anos = Math.floor(diffMeses / 12)
    return `${anos} ${anos === 1 ? 'ano' : 'anos'} na plataforma`
  } catch {
    return 'Tempo na plataforma não informado'
  }
}

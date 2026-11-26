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

/**
 * Formata um valor numérico em Real (BRL).
 * Ex: 30000 -> "R$ 30.000"
 */
export function formatarMoeda(valor?: number | null): string {
  if (valor === undefined || valor === null || isNaN(valor) || valor <= 0) {
    return 'A combinar'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

const ROTULOS_PORTE: Record<string, string> = {
  micro: 'Microempresa',
  small: 'Pequeno',
  medium: 'Médio',
  big: 'Grande',
}

export function formatarPorteEmpresa(porte?: string | null): string {
  if (!porte) return ''
  return ROTULOS_PORTE[porte.toLowerCase()] || porte
}


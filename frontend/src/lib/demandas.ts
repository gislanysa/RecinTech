import { api } from '@/lib/api.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'

export type StatusDemanda = 'aberta' | 'em_andamento' | 'encerrada'

export type Demanda = {
  id: string
  company_id: string
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
  status: StatusDemanda
  created_at: string
}

export type CriarDemandaPayload = {
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
}

export type AtualizarDemandaPayload = {
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
  status?: StatusDemanda
}

export type ConviteReuniao = {
  id: string
  company_id: string
  startup_id: string
  startup_nome: string
  demanda_id?: string
  demanda_titulo?: string
  mensagem?: string
  status: 'pendente' | 'aceito' | 'recusado'
  created_at: string
}

export type EnviarConvitePayload = {
  startupId: string
  startupNome: string
  demandaId?: string
  demandaTitulo?: string
  mensagem?: string
}

export type Recomendacao = {
  startup: StartupCatalogo
  demanda: Demanda
  motivos: string[]
}

/**
 * GET /api/company/:companyId/demand
 *
 * Lista as demandas da empresa cadastradas no backend.
 */
export async function listarDemandas(companyId: string): Promise<Demanda[]> {
  const { data } = await api.get<Demanda[]>(`/company/${companyId}/demand`)
  return data
}

/**
 * POST /api/company/:companyId/demand
 *
 * Cria uma nova demanda da empresa no backend.
 */
export async function criarDemanda(
  companyId: string,
  dados: CriarDemandaPayload,
): Promise<Demanda> {
  const payload = {
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim(),
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
  }

  const { data } = await api.post<Demanda>(`/company/${companyId}/demand`, payload)
  return data
}

/**
 * PUT /api/company/:companyId/demand/:demandaId
 *
 * Atualiza os dados de uma demanda existente no backend.
 */
export async function atualizarDemanda(
  companyId: string,
  demandaId: string,
  dados: AtualizarDemandaPayload,
): Promise<Demanda> {
  const payload = {
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim(),
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
    ...(dados.status ? { status: dados.status } : {}),
  }

  const { data } = await api.put<Demanda>(`/company/${companyId}/demand/${demandaId}`, payload)
  return data
}

/**
 * DELETE /api/company/:companyId/demand/:demandaId
 *
 * Remove uma demanda da empresa no backend.
 */
export async function excluirDemanda(companyId: string, demandaId: string): Promise<void> {
  await api.delete(`/company/${companyId}/demand/${demandaId}`)
}

/**
 * GET /api/company/:companyId/meetings
 *
 * Lista os convites de reunião enviados pela empresa.
 */
export async function listarConvites(companyId: string): Promise<ConviteReuniao[]> {
  const { data } = await api.get<ConviteReuniao[]>(`/company/${companyId}/meetings`)
  return data
}

/**
 * POST /api/company/:companyId/meetings
 *
 * Envia um novo convite de reunião para uma startup via backend.
 */
export async function enviarConviteReuniao(
  companyId: string,
  dados: EnviarConvitePayload,
): Promise<ConviteReuniao> {
  const payload = {
    startup_id: dados.startupId,
    startup_nome: dados.startupNome,
    demanda_id: dados.demandaId,
    demanda_titulo: dados.demandaTitulo,
    mensagem: dados.mensagem?.trim(),
  }

  const { data } = await api.post<ConviteReuniao>(`/company/${companyId}/meetings`, payload)
  return data
}

/**
 * Algoritmo de compatibilidade que relaciona demandas da empresa com startups do catálogo
 * com base em serviços, tecnologias e segmentos correspondentes.
 */
export function calcularRecomendacoes(
  demandas: Demanda[],
  startups: StartupCatalogo[],
  demandaFiltroId?: string,
): Recomendacao[] {
  const demandasAlvo = demandaFiltroId
    ? demandas.filter((d) => d.id === demandaFiltroId && d.status !== 'encerrada')
    : demandas.filter((d) => d.status !== 'encerrada')

  const recomendacoes: Recomendacao[] = []
  const vistas = new Set<string>()

  for (const demanda of demandasAlvo) {
    for (const startup of startups) {
      const chave = `${demanda.id}-${startup.id}`
      if (vistas.has(chave)) continue

      const motivos: string[] = []

      // Checa correspondência de segmento
      if (demanda.segmento && startup.segments.includes(demanda.segmento)) {
        motivos.push(`Segmento compatível: ${demanda.segmento}`)
      }

      // Checa correspondência de serviços
      const servicosComuns = demanda.servicos.filter((s) => startup.services.includes(s))
      if (servicosComuns.length > 0) {
        motivos.push(`Serviços: ${servicosComuns.join(', ')}`)
      }

      // Checa correspondência de tecnologias
      const tecsComuns = demanda.tecnologias.filter((t) => startup.technologies.includes(t))
      if (tecsComuns.length > 0) {
        motivos.push(`Tecnologias: ${tecsComuns.join(', ')}`)
      }

      // Se houver qualquer afinidade relevante, adiciona à lista
      if (motivos.length > 0) {
        vistas.add(chave)
        recomendacoes.push({
          startup,
          demanda,
          motivos,
        })
      }
    }
  }

  return recomendacoes
}

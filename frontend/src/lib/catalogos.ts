import {
  api,
  associarExpertiseStartup,
  desassociarExpertiseStartup,
  associarSegmentoStartup,
  desassociarSegmentoStartup,
  associarServicoStartup,
  desassociarServicoStartup,
  associarTecnologiaStartup,
  desassociarTecnologiaStartup,
} from '@/lib/api.ts'
import { AREAS, SEGMENTS, SERVICES, TECHNOLOGIES } from '@/lib/startups.ts'

export type ItemCatalogo = {
  id: string
  name: string
  description?: string
}

export const LIMITE_PADRAO_CATALOGO = 100

/**
 * GET /api/segment?limit=&offset=
 */
export async function buscarSegmentos(): Promise<ItemCatalogo[]> {
  try {
    const { data } = await api.get<ItemCatalogo[]>('/segment', {
      params: { limit: LIMITE_PADRAO_CATALOGO, offset: 0 },
    })
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch {
    // Falha silenciosa para fallback
  }

  // Fallback para os segmentos padrão conhecidos
  return SEGMENTS.map((nome, index) => ({
    id: `seg-default-${index + 1}`,
    name: nome,
    description: `Segmento de ${nome}`,
  }))
}

/**
 * GET /api/service?limit=&offset=
 */
export async function buscarServicos(): Promise<ItemCatalogo[]> {
  try {
    const { data } = await api.get<ItemCatalogo[]>('/service', {
      params: { limit: LIMITE_PADRAO_CATALOGO, offset: 0 },
    })
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch {
    // Falha silenciosa para fallback
  }

  return SERVICES.map((nome, index) => ({
    id: `serv-default-${index + 1}`,
    name: nome,
    description: `Serviço de ${nome}`,
  }))
}

/**
 * GET /api/technology?limit=&offset=
 */
export async function buscarTecnologias(): Promise<ItemCatalogo[]> {
  try {
    const { data } = await api.get<ItemCatalogo[]>('/technology', {
      params: { limit: LIMITE_PADRAO_CATALOGO, offset: 0 },
    })
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch {
    // Falha silenciosa para fallback
  }

  return TECHNOLOGIES.map((nome, index) => ({
    id: `tec-default-${index + 1}`,
    name: nome,
    description: `Tecnologia ${nome}`,
  }))
}

/**
 * GET /api/expertise?limit=&offset=
 */
export async function buscarExpertises(): Promise<ItemCatalogo[]> {
  try {
    const { data } = await api.get<ItemCatalogo[]>('/expertise', {
      params: { limit: LIMITE_PADRAO_CATALOGO, offset: 0 },
    })
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch {
    // Falha silenciosa para fallback
  }

  return AREAS.map((nome, index) => ({
    id: `exp-default-${index + 1}`,
    name: nome,
    description: `Área de atuação: ${nome}`,
  }))
}

export type TagsDetalhadasStartup = {
  expertises: ItemCatalogo[]
  services: ItemCatalogo[]
  technologies: ItemCatalogo[]
  segments: ItemCatalogo[]
}

/**
 * Carrega as tags da startup diretamente com seus respectivos IDs.
 */
export async function carregarTagsDetalhadasStartup(
  startupId: string,
): Promise<TagsDetalhadasStartup> {
  const [exp, serv, tec, seg] = await Promise.all([
    api.get<ItemCatalogo[]>(`/startup/${startupId}/expertise`).then((r) => r.data).catch(() => []),
    api.get<ItemCatalogo[]>(`/startup/${startupId}/service`).then((r) => r.data).catch(() => []),
    api.get<ItemCatalogo[]>(`/startup/${startupId}/technology`).then((r) => r.data).catch(() => []),
    api.get<ItemCatalogo[]>(`/startup/${startupId}/segment`).then((r) => r.data).catch(() => []),
  ])

  return {
    expertises: Array.isArray(exp) ? exp : [],
    services: Array.isArray(serv) ? serv : [],
    technologies: Array.isArray(tec) ? tec : [],
    segments: Array.isArray(seg) ? seg : [],
  }
}

/**
 * Atualiza as associações de tags da startup calculando inclusões e remoções em lote.
 */
export async function salvarTagsStartup(
  startupId: string,
  novosIds: {
    expertises: string[]
    services: string[]
    technologies: string[]
    segments: string[]
  },
  atuaisIds: {
    expertises: string[]
    services: string[]
    technologies: string[]
    segments: string[]
  },
): Promise<void> {
  const operacoes: Promise<unknown>[] = []

  // Expertises
  for (const id of novosIds.expertises) {
    if (!atuaisIds.expertises.includes(id)) {
      operacoes.push(associarExpertiseStartup(startupId, id))
    }
  }
  for (const id of atuaisIds.expertises) {
    if (!novosIds.expertises.includes(id)) {
      operacoes.push(desassociarExpertiseStartup(startupId, id))
    }
  }

  // Serviços
  for (const id of novosIds.services) {
    if (!atuaisIds.services.includes(id)) {
      operacoes.push(associarServicoStartup(startupId, id))
    }
  }
  for (const id of atuaisIds.services) {
    if (!novosIds.services.includes(id)) {
      operacoes.push(desassociarServicoStartup(startupId, id))
    }
  }

  // Tecnologias
  for (const id of novosIds.technologies) {
    if (!atuaisIds.technologies.includes(id)) {
      operacoes.push(associarTecnologiaStartup(startupId, id))
    }
  }
  for (const id of atuaisIds.technologies) {
    if (!novosIds.technologies.includes(id)) {
      operacoes.push(desassociarTecnologiaStartup(startupId, id))
    }
  }

  // Segmentos
  for (const id of novosIds.segments) {
    if (!atuaisIds.segments.includes(id)) {
      operacoes.push(associarSegmentoStartup(startupId, id))
    }
  }
  for (const id of atuaisIds.segments) {
    if (!novosIds.segments.includes(id)) {
      operacoes.push(desassociarSegmentoStartup(startupId, id))
    }
  }

  await Promise.all(operacoes)
}

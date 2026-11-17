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
 * Valida se uma string é um UUID válido no formato 8-4-4-4-12.
 */
export function ehUuidValido(valor: unknown): valor is string {
  if (typeof valor !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)
}

/**
 * Gera um UUID válido determinístico para itens de fallback (evitando formatos inválidos como seg-default-1
 * que quebram o decodificador de UUID do backend Gleam).
 */
export function gerarUuidFallback(tipo: 'seg' | 'serv' | 'tec' | 'exp', indice: number): string {
  const tipoHexMap = { seg: '0001', serv: '0002', tec: '0003', exp: '0004' }
  const prefixo = tipoHexMap[tipo]
  const sufixo = String(indice).padStart(12, '0')
  return `01930000-0000-7000-${prefixo}-${sufixo}`
}

/**
 * Verifica se um UUID é um identificador de fallback gerado no cliente
 * (portanto, inexistente no banco de dados relacional e não utilizável como chave estrangeira).
 */
export function ehUuidFallback(valor: unknown): boolean {
  if (typeof valor !== 'string') return false
  return (
    valor.startsWith('01930000-0000-7000-') ||
    valor.startsWith('seg-default') ||
    valor.startsWith('serv-default') ||
    valor.startsWith('tec-default') ||
    valor.startsWith('exp-default')
  )
}

/**
 * Valida se é um UUID válido e não é um fallback sintético gerado no cliente.
 */
export function ehUuidReal(valor: unknown): valor is string {
  return ehUuidValido(valor) && !ehUuidFallback(valor)
}

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

  // Fallback para os segmentos padrão conhecidos com UUIDs válidos
  return SEGMENTS.map((nome, index) => ({
    id: gerarUuidFallback('seg', index + 1),
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
    id: gerarUuidFallback('serv', index + 1),
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
    id: gerarUuidFallback('tec', index + 1),
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
    id: gerarUuidFallback('exp', index + 1),
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

  const tratarIdempotencia = (p: unknown) => {
    if (!p || typeof (p as Promise<unknown>).catch !== 'function') {
      return Promise.resolve(p)
    }
    return (p as Promise<unknown>).catch((err: unknown) => {
      // 409 (já associado) ou 404 (já removido) não devem quebrar o salvamento
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 409 || status === 404) {
          return null
        }
      }
      throw err
    })
  }

  const novosExps = Array.from(new Set(novosIds.expertises.filter(Boolean)))
  const atuaisExps = Array.from(new Set(atuaisIds.expertises.filter(Boolean)))

  const novosServs = Array.from(new Set(novosIds.services.filter(Boolean)))
  const atuaisServs = Array.from(new Set(atuaisIds.services.filter(Boolean)))

  const novosTecs = Array.from(new Set(novosIds.technologies.filter(Boolean)))
  const atuaisTecs = Array.from(new Set(atuaisIds.technologies.filter(Boolean)))

  const novosSegs = Array.from(new Set(novosIds.segments.filter(Boolean)))
  const atuaisSegs = Array.from(new Set(atuaisIds.segments.filter(Boolean)))

  // Expertises
  for (const id of novosExps) {
    if (!atuaisExps.includes(id)) {
      operacoes.push(tratarIdempotencia(associarExpertiseStartup(startupId, id)))
    }
  }
  for (const id of atuaisExps) {
    if (!novosExps.includes(id)) {
      operacoes.push(tratarIdempotencia(desassociarExpertiseStartup(startupId, id)))
    }
  }

  // Serviços
  for (const id of novosServs) {
    if (!atuaisServs.includes(id)) {
      operacoes.push(tratarIdempotencia(associarServicoStartup(startupId, id)))
    }
  }
  for (const id of atuaisServs) {
    if (!novosServs.includes(id)) {
      operacoes.push(tratarIdempotencia(desassociarServicoStartup(startupId, id)))
    }
  }

  // Tecnologias
  for (const id of novosTecs) {
    if (!atuaisTecs.includes(id)) {
      operacoes.push(tratarIdempotencia(associarTecnologiaStartup(startupId, id)))
    }
  }
  for (const id of atuaisTecs) {
    if (!novosTecs.includes(id)) {
      operacoes.push(tratarIdempotencia(desassociarTecnologiaStartup(startupId, id)))
    }
  }

  // Segmentos
  for (const id of novosSegs) {
    if (!atuaisSegs.includes(id)) {
      operacoes.push(tratarIdempotencia(associarSegmentoStartup(startupId, id)))
    }
  }
  for (const id of atuaisSegs) {
    if (!novosSegs.includes(id)) {
      operacoes.push(tratarIdempotencia(desassociarSegmentoStartup(startupId, id)))
    }
  }

  await Promise.all(operacoes)
}

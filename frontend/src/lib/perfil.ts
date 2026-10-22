import type { Startup } from '@/lib/api.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'

/** Dias sem atualizar o perfil a partir dos quais o alerta aparece. */
export const DIAS_PARA_PERFIL_DESATUALIZADO = 90

export type Tags = Awaited<ReturnType<typeof carregarTagsDaStartup>>

export type ItemSaude = {
  chave: string
  rotulo: string
  preenchido: boolean
}

export type SaudeDoPerfil = {
  /** 0–100 */
  porcentagem: number
  itens: ItemSaude[]
  faltando: ItemSaude[]
}

/**
 * Campos considerados "relevantes" para o perfil: os do cadastro
 * (`POST /startup`) mais as tags (serviços, tecnologias, segmentos e área de
 * atuação), que o dashboard busca nas rotas `/startup/:id/<recurso>`.
 * Todos têm o mesmo peso.
 */
export function calcularSaudeDoPerfil(startup: Startup, tags: Tags | null): SaudeDoPerfil {
  const preenchido = (valor: string | undefined) => !!valor && valor.trim().length > 0

  const itens: ItemSaude[] = [
    { chave: 'description', rotulo: 'Descrição', preenchido: preenchido(startup.description) },
    { chave: 'city', rotulo: 'Cidade', preenchido: preenchido(startup.city) },
    { chave: 'state', rotulo: 'Estado', preenchido: preenchido(startup.state) },
    { chave: 'website', rotulo: 'Site', preenchido: preenchido(startup.website) },
    { chave: 'stage', rotulo: 'Estágio', preenchido: preenchido(startup.stage) },
    { chave: 'cnpj', rotulo: 'CNPJ', preenchido: preenchido(startup.cnpj) },
    { chave: 'services', rotulo: 'Serviços', preenchido: (tags?.services.length ?? 0) > 0 },
    { chave: 'technologies', rotulo: 'Tecnologias', preenchido: (tags?.technologies.length ?? 0) > 0 },
    { chave: 'segments', rotulo: 'Segmentos', preenchido: (tags?.segments.length ?? 0) > 0 },
    { chave: 'area', rotulo: 'Área de atuação', preenchido: preenchido(tags?.area) },
  ]

  const feitos = itens.filter((item) => item.preenchido).length
  return {
    porcentagem: Math.round((feitos / itens.length) * 100),
    itens,
    faltando: itens.filter((item) => !item.preenchido),
  }
}

const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Dias desde a última atualização do perfil, ou `null` quando o backend não
 * informou a data (hoje não informa — ver `Startup.updated_at`). Nesse caso a
 * tela não exibe o alerta, em vez de inventar uma data.
 */
export function diasSemAtualizar(startup: Startup, agora: Date = new Date()): number | null {
  if (!startup.updated_at) return null
  const data = new Date(startup.updated_at)
  if (Number.isNaN(data.getTime())) return null
  return Math.floor((agora.getTime() - data.getTime()) / MS_POR_DIA)
}

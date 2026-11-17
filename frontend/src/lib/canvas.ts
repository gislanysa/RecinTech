import { api } from '@/lib/api.ts'

/**
 * Business Model Canvas da startup conectado à API real.
 */

export const BLOCOS_CANVAS = [
  { chave: 'segmentosClientes', backendChave: 'customer_segments', titulo: 'Segmentos de clientes', dica: 'Para quem a startup cria valor?' },
  { chave: 'propostaValor', backendChave: 'value_proposition', titulo: 'Proposta de valor', dica: 'Que problema resolve e que valor entrega?' },
  { chave: 'canais', backendChave: 'channels', titulo: 'Canais', dica: 'Como chega até os clientes?' },
  { chave: 'relacionamento', backendChave: 'customer_relationships', titulo: 'Relacionamento com clientes', dica: 'Como se relaciona e mantém clientes?' },
  { chave: 'receitas', backendChave: 'revenue_streams', titulo: 'Fontes de receita', dica: 'Como a startup ganha dinheiro?' },
  { chave: 'recursos', backendChave: 'key_resources', titulo: 'Recursos principais', dica: 'O que é essencial para operar?' },
  { chave: 'atividades', backendChave: 'key_activities', titulo: 'Atividades principais', dica: 'O que a startup precisa fazer bem?' },
  { chave: 'parcerias', backendChave: 'key_partnerships', titulo: 'Parcerias principais', dica: 'Quem são os parceiros e fornecedores-chave?' },
  { chave: 'custos', backendChave: 'cost_structure', titulo: 'Estrutura de custos', dica: 'Quais são os maiores custos?' },
] as const

export type ChaveCanvas = (typeof BLOCOS_CANVAS)[number]['chave']
export type CanvasStartup = Record<ChaveCanvas, string>

export type CanvasBackend = {
  customer_segments: string
  value_proposition: string
  channels: string
  customer_relationships: string
  revenue_streams: string
  key_resources: string
  key_activities: string
  key_partnerships: string
  cost_structure: string
}

export function canvasVazio(): CanvasStartup {
  return Object.fromEntries(BLOCOS_CANVAS.map((b) => [b.chave, ''])) as CanvasStartup
}

export function temConteudo(canvas: CanvasStartup): boolean {
  return BLOCOS_CANVAS.some((b) => (canvas[b.chave] ?? '').trim() !== '')
}

export function backendParaCanvas(dados?: Partial<CanvasBackend> | null): CanvasStartup {
  const vazio = canvasVazio()
  if (!dados) return vazio
  return {
    segmentosClientes: dados.customer_segments ?? '',
    propostaValor: dados.value_proposition ?? '',
    canais: dados.channels ?? '',
    relacionamento: dados.customer_relationships ?? '',
    receitas: dados.revenue_streams ?? '',
    recursos: dados.key_resources ?? '',
    atividades: dados.key_activities ?? '',
    parcerias: dados.key_partnerships ?? '',
    custos: dados.cost_structure ?? '',
  }
}

export function canvasParaBackend(canvas: CanvasStartup): CanvasBackend {
  return {
    customer_segments: (canvas.segmentosClientes ?? '').trim(),
    value_proposition: (canvas.propostaValor ?? '').trim(),
    channels: (canvas.canais ?? '').trim(),
    customer_relationships: (canvas.relacionamento ?? '').trim(),
    revenue_streams: (canvas.receitas ?? '').trim(),
    key_resources: (canvas.recursos ?? '').trim(),
    key_activities: (canvas.atividades ?? '').trim(),
    key_partnerships: (canvas.parcerias ?? '').trim(),
    cost_structure: (canvas.custos ?? '').trim(),
  }
}

/**
 * GET /api/startup/:id/canvas
 *
 * Busca o Business Model Canvas da startup na API.
 */
export async function carregarCanvas(startupId: string): Promise<CanvasStartup> {
  if (!startupId) return canvasVazio()
  try {
    const { data } = await api.get<CanvasBackend>(`/startup/${startupId}/canvas`)
    return backendParaCanvas(data)
  } catch {
    return canvasVazio()
  }
}

/**
 * PUT /api/startup/:id/canvas
 *
 * Salva ou atualiza o Business Model Canvas da startup na API.
 */
export async function salvarCanvas(
  startupId: string,
  canvas: CanvasStartup,
): Promise<CanvasStartup> {
  const payload = canvasParaBackend(canvas)
  const { data } = await api.put<CanvasBackend>(`/startup/${startupId}/canvas`, payload)
  return backendParaCanvas(data)
}

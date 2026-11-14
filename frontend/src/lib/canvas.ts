/**
 * Business Model Canvas da startup.
 *
 * O backend ainda não tem campo nem rota para o canvas, então ele fica no
 * `localStorage` do navegador. Todo o acesso passa por `carregarCanvas` e
 * `salvarCanvas`: quando a API existir, só essas duas funções precisam mudar.
 * Enquanto isso, o perfil público só mostra o canvas neste navegador.
 */

export const BLOCOS_CANVAS = [
  { chave: 'segmentosClientes', titulo: 'Segmentos de clientes', dica: 'Para quem a startup cria valor?' },
  { chave: 'propostaValor', titulo: 'Proposta de valor', dica: 'Que problema resolve e que valor entrega?' },
  { chave: 'canais', titulo: 'Canais', dica: 'Como chega até os clientes?' },
  { chave: 'relacionamento', titulo: 'Relacionamento com clientes', dica: 'Como se relaciona e mantém clientes?' },
  { chave: 'receitas', titulo: 'Fontes de receita', dica: 'Como a startup ganha dinheiro?' },
  { chave: 'recursos', titulo: 'Recursos principais', dica: 'O que é essencial para operar?' },
  { chave: 'atividades', titulo: 'Atividades principais', dica: 'O que a startup precisa fazer bem?' },
  { chave: 'parcerias', titulo: 'Parcerias principais', dica: 'Quem são os parceiros e fornecedores-chave?' },
  { chave: 'custos', titulo: 'Estrutura de custos', dica: 'Quais são os maiores custos?' },
] as const

export type ChaveCanvas = (typeof BLOCOS_CANVAS)[number]['chave']
export type CanvasStartup = Record<ChaveCanvas, string>

export function canvasVazio(): CanvasStartup {
  return Object.fromEntries(BLOCOS_CANVAS.map((b) => [b.chave, ''])) as CanvasStartup
}

const chaveDeArmazenamento = (startupId: string) => `recintech:canvas:${startupId}`

export function temConteudo(canvas: CanvasStartup): boolean {
  return BLOCOS_CANVAS.some((b) => canvas[b.chave].trim() !== '')
}

export function carregarCanvas(startupId: string): CanvasStartup {
  const vazio = canvasVazio()
  try {
    const bruto = localStorage.getItem(chaveDeArmazenamento(startupId))
    if (!bruto) return vazio
    const dados = JSON.parse(bruto) as Partial<Record<ChaveCanvas, unknown>>
    for (const { chave } of BLOCOS_CANVAS) {
      if (typeof dados[chave] === 'string') vazio[chave] = dados[chave]
    }
  } catch {
    // JSON inválido ou storage indisponível: volta ao canvas vazio.
  }
  return vazio
}

export function salvarCanvas(startupId: string, canvas: CanvasStartup): void {
  const limpo = canvasVazio()
  for (const { chave } of BLOCOS_CANVAS) limpo[chave] = canvas[chave].trim()
  localStorage.setItem(chaveDeArmazenamento(startupId), JSON.stringify(limpo))
}

/**
 * Planos de assinatura da startup.
 *
 * O backend NÃO tem campo de plano: não há coluna em `startup` nem rota de
 * assinatura, e nenhum meio de pagamento está integrado. Por isso toda conta
 * é tratada como gratuita, e a contratação do premium ainda não acontece.
 *
 * Quando existir, o plano vem do backend e `PLANO_ATUAL` sai daqui.
 */
export type IdPlano = 'gratuito' | 'premium'

export type Plano = {
  id: IdPlano
  nome: string
  /** Em reais por mês. */
  preco: number
  recursos: string[]
}

export const PLANOS: Plano[] = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    preco: 0,
    recursos: ['Perfil técnico completo', 'Até 3 cases', 'Recebe oportunidades compatíveis'],
  },
  {
    id: 'premium',
    nome: 'Premium',
    preco: 50,
    recursos: [
      'Tudo do gratuito',
      'Destaque na busca, marcado como Patrocinado',
      'Selo de perfil verificado',
      'Até 12 cases',
      'Relatório de visualizações',
    ],
  },
]

/** Enquanto o backend não informa o plano, toda conta é gratuita. */
export const PLANO_ATUAL: IdPlano = 'gratuito'

/**
 * Se a conta tem assinatura paga.
 *
 * Enquanto o backend não informa o plano, isto é sempre `false`: nenhuma conta
 * consegue assinar, porque não há meio de pagamento nem campo no banco.
 */
export function ehPremium(): boolean {
  return PLANO_ATUAL === 'premium'
}

/** Como o plano em uso aparece na interface, por exemplo "Plano gratuito". */
export function rotuloDoPlanoAtual(): string {
  const plano = PLANOS.find((p) => p.id === PLANO_ATUAL)
  return `Plano ${plano ? plano.nome.toLowerCase() : 'gratuito'}`
}

export function formatarPreco(valor: number): string {
  if (valor === 0) return 'R$ 0'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

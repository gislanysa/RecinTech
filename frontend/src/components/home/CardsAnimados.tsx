import { useEffect, useState } from 'react'

type Cartao = {
  tipo: 'Empresa' | 'Startup'
  nome: string
  contexto: string
  texto: string
  tags: string[]
}

/**
 * Exemplos fictícios. Nenhuma empresa ou startup real está cadastrada ainda —
 * quando o catálogo existir, estes cartões passam a vir da API (ver o issue de
 * integração). A forma de cada item já é a que o componente espera receber.
 *
 * Os pares foram escritos para se responderem: cada necessidade de empresa é
 * seguida da startup que a resolveria. É o que faz o rodízio explicar o
 * produto sozinho, sem precisar de legenda.
 */
const CARTOES: Cartao[] = [
  {
    tipo: 'Empresa',
    nome: 'Rede de varejo',
    contexto: 'Varejo · Recife, PE',
    texto:
      'Precisamos de um aplicativo para gerenciamento de pedidos, integrado ao nosso sistema de varejo.',
    tags: ['Mobile', 'Integração', 'Varejo'],
  },
  {
    tipo: 'Startup',
    nome: 'Mobilize Labs',
    contexto: 'Tecnologia · Recife, PE',
    texto: 'Estúdio de produtos mobile de alta performance, do protótipo à loja.',
    tags: ['Desenvolvimento mobile', 'React Native', 'UX/UI'],
  },
  {
    tipo: 'Empresa',
    nome: 'Rede de clínicas',
    contexto: 'Saúde · Recife, PE',
    texto: 'Queremos integrar o prontuário das nossas unidades numa plataforma de telessaúde.',
    tags: ['Saúde', 'Integração', 'Web'],
  },
  {
    tipo: 'Startup',
    nome: 'Vita HealthTech',
    contexto: 'Saúde · Recife, PE',
    texto: 'Plataformas de telessaúde e prontuário inteligente para clínicas e operadoras.',
    tags: ['Desenvolvimento web', 'Inteligência artificial', 'HealthTech'],
  },
  {
    tipo: 'Empresa',
    nome: 'Fintech de crédito',
    contexto: 'Finanças · Recife, PE',
    texto: 'Precisamos reduzir fraude no checkout e automatizar a análise de crédito.',
    tags: ['Antifraude', 'Dados', 'FinTech'],
  },
  {
    tipo: 'Startup',
    nome: 'CredMatch',
    contexto: 'Finanças · Recife, PE',
    texto: 'Motores de crédito, antifraude e open finance como serviço.',
    tags: ['Inteligência artificial', 'Análise de dados', 'FinTech'],
  },
]

const INTERVALO_MS = 4000

export default function CardsAnimados() {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = setInterval(() => {
      setIndice((atual) => (atual + 1) % CARTOES.length)
    }, INTERVALO_MS)

    return () => clearInterval(id)
  }, [pausado])

  const cartao = CARTOES[indice]
  const empresa = cartao.tipo === 'Empresa'

  return (
    <div
      className="relative min-w-0"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {/* ---------------- tampa ----------------
          Bisel fino nas laterais e no topo, mais grosso embaixo, como no
          aparelho real. O anel claro simula o chanfro usinado da borda. */}
      <div className="relative rounded-[14px] bg-gradient-to-b from-[#1b2a38] to-[#0d161e] px-[10px] pb-[16px] pt-[10px] ring-1 ring-white/10">
        {/* câmera, centrada no bisel de cima */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[4px] size-[3px] -translate-x-1/2 rounded-full bg-white/20 ring-1 ring-white/10"
        />

        {/* tela */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-[5px] bg-surface-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <div className="h-full p-4">
            {/* key={indice} remonta o bloco a cada troca, disparando a animação */}
            <article
              key={indice}
              className={[
                'flex h-full animate-entra flex-col rounded-xl p-5 shadow-sm',
                empresa ? 'bg-brand-600' : 'bg-surface ring-1 ring-brand-200',
              ].join(' ')}
            >
              {/* quem está falando vem primeiro: dá contexto antes da frase */}
              <div className="flex items-center justify-between gap-3">
                <span
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider',
                    empresa ? 'bg-white/15 text-brand-100' : 'bg-brand-50 text-brand-700',
                  ].join(' ')}
                >
                  {empresa ? 'Empresa' : 'Startup'}
                </span>
                <span
                  className={['text-[11px]', empresa ? 'text-brand-200' : 'text-ink-500'].join(' ')}
                >
                  Exemplo
                </span>
              </div>

              <p
                className={[
                  'mt-4 font-display text-lg font-semibold',
                  empresa ? 'text-white' : 'text-ink-900',
                ].join(' ')}
              >
                {cartao.nome}
              </p>
              <p className={['text-xs', empresa ? 'text-brand-200' : 'text-ink-500'].join(' ')}>
                {cartao.contexto}
              </p>

              {/* o rótulo diz o papel da frase — é o que torna o par legível */}
              <p
                className={[
                  'mt-5 text-[11px] font-semibold uppercase tracking-wider',
                  empresa ? 'text-brand-200' : 'text-brand-600',
                ].join(' ')}
              >
                {empresa ? 'Necessidade' : 'Oferece'}
              </p>
              <p
                className={[
                  'mt-1 flex-1 text-base leading-relaxed',
                  empresa ? 'text-white' : 'text-ink-700',
                ].join(' ')}
              >
                {cartao.texto}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {cartao.tags.map((tag) => (
                  <span
                    key={tag}
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      empresa ? 'bg-white/10 text-brand-100' : 'bg-brand-50 text-brand-700',
                    ].join(' ')}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </div>

          {/* reflexo do vidro: clarão em diagonal, some antes da metade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.20)_0%,rgb(255_255_255/0.05)_26%,transparent_46%)]"
          />
        </div>
      </div>

      {/* ---------------- dobradiça ----------------
          Faixa escura entre a tampa e a base, um pouco mais larga que a tampa. */}
      <div
        aria-hidden="true"
        className="-mx-[2.5%] h-[7px] bg-gradient-to-b from-[#0d161e] via-[#6f7d88] to-[#aeb9c2]"
      />

      {/* ---------------- base ----------------
          Mais larga que a tampa, com o degradê do alumínio e a aresta frontal
          mais escura. A sombra embaixo é o que assenta o aparelho na página. */}
      <div
        aria-hidden="true"
        className="-mx-[4%] h-[11px] rounded-b-[9px] bg-gradient-to-b from-[#d7dee4] via-[#eef2f4] to-[#b9c4cd] shadow-[0_16px_28px_-14px_rgb(0_0_0/0.45)]"
      >
        {/* entalhe para abrir a tampa */}
        <div className="mx-auto h-[4px] w-20 rounded-b-full bg-[#9aa7b2]/60" />
      </div>
    </div>
  )
}

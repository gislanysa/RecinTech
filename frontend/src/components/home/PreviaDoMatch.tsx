import { CheckIcon, SparkIcon } from '@/components/icons.tsx'
import { useEffect, useState } from 'react'

type Exemplo = {
  necessidade: string
  sigla: string
  nome: string
  area: string
  cidade: string
  score: number
  motivos: string[]
}

/**
 * Exemplos ilustrativos. Quando o catálogo existir, isso vira uma chamada a
 * `GET /demands/:id/matches` — a estrutura de cada item já é a da resposta.
 */
const EXEMPLOS: Exemplo[] = [
  {
    necessidade:
      'Precisamos de um aplicativo para gerenciamento de pedidos, integrado ao nosso sistema de varejo.',
    sigla: 'ML',
    nome: 'Mobilize Labs',
    area: 'Tecnologia',
    cidade: 'Recife, PE',
    score: 94,
    motivos: ['Desenvolvimento mobile', 'React Native', 'Varejo'],
  },
  {
    necessidade:
      'Queremos reduzir fraude no checkout e automatizar a análise de crédito dos clientes.',
    sigla: 'CM',
    nome: 'CredMatch',
    area: 'Finanças',
    cidade: 'Recife, PE',
    score: 91,
    motivos: ['Antifraude', 'Análise de dados', 'FinTech'],
  },
  {
    necessidade:
      'Buscamos uma plataforma de telessaúde para integrar o prontuário das nossas clínicas.',
    sigla: 'VH',
    nome: 'Vita HealthTech',
    area: 'Saúde',
    cidade: 'Recife, PE',
    score: 89,
    motivos: ['Desenvolvimento web', 'Inteligência artificial', 'HealthTech'],
  },
]

const INTERVALO_MS = 5000

/**
 * Mostra, em vez de prometer, o que diferencia a plataforma: a recomendação vem
 * com o motivo. Os exemplos se alternam sozinhos, param quando o mouse entra ou
 * algo dentro recebe foco, e não rodam para quem pediu menos movimento no sistema.
 */
export default function PreviaDoMatch() {
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = setInterval(() => {
      setIndice((atual) => (atual + 1) % EXEMPLOS.length)
    }, INTERVALO_MS)

    return () => clearInterval(id)
  }, [pausado])

  const exemplo = EXEMPLOS[indice]

  return (
    <div className="relative min-w-0">
      <div
        className="rounded-2xl bg-brand-600 p-4 shadow-lg shadow-brand-900/20"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-brand-100">
          A empresa descreve a necessidade
        </p>

        {/* key={indice} remonta o bloco a cada troca, disparando a animação de entrada. */}
        <div key={indice} className="animate-entra">
          {/* altura mínima de 3 linhas: sem isso o card pula de tamanho a cada troca */}
          <p className="mt-2 min-h-[4.25rem] text-sm leading-relaxed text-white">
            “{exemplo.necessidade}”
          </p>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/25" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-700">
              <SparkIcon className="size-3.5" />
              Matchmaking
            </span>
            <span className="h-px flex-1 bg-white/25" />
          </div>

          <article className="rounded-xl bg-surface p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-100 font-display text-sm font-bold text-brand-700">
                {exemplo.sigla}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-ink-900">{exemplo.nome}</p>
                <p className="text-xs text-ink-500">
                  {exemplo.area} · {exemplo.cidade}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-bold text-accent-700">
                {exemplo.score}%
              </span>
            </div>

            <p className="mt-3 text-xs font-medium text-ink-500">Compatível em:</p>
            <ul className="mt-2 space-y-1.5">
              {exemplo.motivos.map((motivo) => (
                <li key={motivo} className="flex items-center gap-2 text-sm text-ink-700">
                  <CheckIcon className="size-4 shrink-0 text-accent-600" />
                  {motivo}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {EXEMPLOS.map((item, posicao) => {
          const ativo = posicao === indice
          return (
            <button
              key={item.sigla}
              type="button"
              onClick={() => setIndice(posicao)}
              aria-label={`Ver exemplo ${posicao + 1} de ${EXEMPLOS.length}`}
              aria-current={ativo}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                ativo ? 'w-6 bg-accent-600' : 'w-1.5 bg-brand-200 hover:bg-brand-300',
              ].join(' ')}
            />
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-ink-500">Exemplo ilustrativo</p>
    </div>
  )
}

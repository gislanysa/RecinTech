import { BLOCOS_CANVAS, temConteudo, type CanvasStartup } from '@/lib/canvas.ts'

/** Exibição somente leitura do canvas, no estilo do quadro clássico (3 colunas). */
export default function CanvasPublico({
  canvas,
  exibirSeVazio = false,
}: {
  canvas: CanvasStartup
  exibirSeVazio?: boolean
}) {
  const preenchido = temConteudo(canvas)
  if (!preenchido && !exibirSeVazio) return null

  return (
    <section aria-labelledby="titulo-canvas-publico" className="mt-12">
      <h2 id="titulo-canvas-publico" className="font-display text-sm font-semibold text-ink-900">
        Modelo de negócio (Business Model Canvas)
      </h2>
      {!preenchido ? (
        <p className="mt-4 rounded-card border border-dashed border-brand-200 px-6 py-8 text-center text-sm text-ink-500">
          Esta startup ainda não preencheu os blocos do Business Model Canvas.
        </p>
      ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCOS_CANVAS.map(({ chave, titulo }) => {
            const texto = canvas[chave].trim()
            return (
              <div
                key={chave}
                className="flex flex-col min-h-[100px] sm:min-h-[110px] rounded-xl border border-gray-100 bg-white p-3.5 sm:p-4 shadow-sm"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{titulo}</dt>
                <dd
                  className={
                    texto
                      ? 'mt-1.5 flex-1 whitespace-pre-line text-sm leading-relaxed text-ink-700'
                      : 'mt-1.5 flex-1 text-sm italic text-ink-400'
                  }
                >
                  {texto || 'Não informado'}
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </section>
  )
}

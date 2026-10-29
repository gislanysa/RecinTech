import BotaoCirculo from '@/components/BotaoCirculo.tsx'
import CardsAnimados from '@/components/home/CardsAnimados.tsx'

export default function Hero() {
  return (
    // -mt-16 puxa a seção para trás do cabeçalho transparente (h-16).
    <section className="relative -mt-16 overflow-hidden bg-canvas pt-16">
      {/* Brilho de fundo: dá profundidade sem pesar no tom claro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_0%,var(--color-brand-100),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--color-accent-100),transparent_65%)] opacity-70 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* ---------- coluna da esquerda: a promessa e as duas saídas ---------- */}
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Encontre a startup certa para o que sua empresa precisa.
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-ink-500">
              Explore startups, descubra novas soluções e conecte sua empresa às oportunidades
              certas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <BotaoCirculo to="/startups">Explorar startups</BotaoCirculo>
              <BotaoCirculo to="/criar-conta" variante="secundario">
                Quero fazer meu cadastro
              </BotaoCirculo>
            </div>
          </div>

          {/* ---------- coluna da direita: os dois lados da plataforma ---------- */}
          <CardsAnimados />
        </div>
      </div>
    </section>
  )
}

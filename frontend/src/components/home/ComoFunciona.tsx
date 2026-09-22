type Passo = {
  numero: string
  titulo: string
  descricao: string
}

const PASSOS: Passo[] = [
  {
    numero: '01',
    titulo: 'Explore',
    descricao:
      'Pesquise startups por serviços, tecnologias, segmentos e áreas de atuação. Sem cadastro, sem custo.',
  },
  {
    numero: '02',
    titulo: 'Encontre',
    descricao:
      'Conheça cada startup em profundidade: o que ela faz, com o que trabalha e o que já entregou.',
  },
  {
    numero: '03',
    titulo: 'Conecte',
    descricao:
      'Cadastre sua empresa, informe o que precisa e receba recomendações personalizadas com matchmaking.',
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-16 bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Como funciona</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Três passos entre a necessidade da sua empresa e a startup capaz de resolvê-la.
          </p>
        </div>

        <div className="relative mt-14">
          {/* Liga os três passos: a leitura é uma sequência, não três caixas soltas.
              Fica atrás dos cards, então só aparece nos vãos entre eles. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[3rem] hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block"
          />

          <ol className="relative grid gap-6 lg:grid-cols-3">
            {PASSOS.map(({ numero, titulo, descricao }) => (
              <li
                key={numero}
                className="rounded-card border border-brand-100 bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* O número é o destaque do card. Coral em 48px bold passa em
                    AA para texto grande (3,78:1, mínimo 3:1). */}
                <span className="block font-display text-5xl font-bold leading-none text-accent-600">
                  {numero}
                </span>

                <h3 className="mt-6 text-xl font-semibold">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{descricao}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

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
    <section id="como-funciona" className="scroll-mt-16 bg-surface-2 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Como funciona</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Três passos entre a necessidade da sua empresa e a startup capaz de resolvê-la.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {PASSOS.map(({ numero, titulo, descricao }) => (
            <li key={numero} className="group relative h-72 overflow-hidden rounded-card">
              {/* bloco da marca, com o número em destaque */}
              <div className="absolute inset-0 bg-brand-600 p-6">
                <span className="font-display text-7xl font-bold leading-none text-accent-300">
                  {numero}
                </span>
              </div>

              {/*
                Painel que sobe. No desktop ele começa abaixado, mostrando só o
                rótulo e o título, e revela a descrição no hover.
                No mobile fica sempre aberto: sem mouse não há hover, e a
                descrição não pode depender de um gesto que não existe.
              */}
              <div className="absolute inset-x-0 bottom-0 flex h-44 flex-col gap-1 bg-surface p-5 transition-transform duration-500 ease-out lg:translate-y-[6.5rem] lg:group-hover:translate-y-0">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Passo {numero}
                </span>
                <span className="font-display text-2xl font-bold text-ink-900">{titulo}</span>
                <p className="text-sm leading-relaxed text-ink-500">{descricao}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

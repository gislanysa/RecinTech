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
      'Pesquise startups por serviços, tecnologias, segmentos e áreas de atuação. Sem login e sem limite de buscas.',
  },
  {
    numero: '02',
    titulo: 'Encontre',
    descricao:
      'Abra perfis públicos completos com portfólio, stack, especialidades e segmentos atendidos.',
  },
  {
    numero: '03',
    titulo: 'Conecte',
    descricao:
      'Cadastre sua empresa, descreva a necessidade e receba recomendações personalizadas com matchmaking.',
  },
]

/**
 * Os três passos em cards: bloco da marca com o número em destaque e um painel
 * branco que sobe no hover revelando a descrição.
 *
 * O anel garante a borda do card em qualquer fundo — sem ele, o painel branco
 * se dissolve numa página branca.
 */
export default function PassosComoFunciona() {
  return (
    <ol className="grid gap-6 lg:grid-cols-3">
      {PASSOS.map(({ numero, titulo, descricao }) => (
        <li
          key={numero}
          className="group relative h-72 overflow-hidden rounded-card ring-1 ring-brand-100"
        >
          {/* bloco da marca, com o número em destaque */}
          <div className="absolute inset-0 bg-brand-600 p-6">
            <span className="font-display text-7xl font-bold leading-none text-accent-300">
              {numero}
            </span>
          </div>

          {/*
            Painel que sobe. No desktop ele começa abaixado, mostrando só o
            rótulo e o título, e revela a descrição no hover.
            No mobile fica sempre aberto: sem mouse não há hover, e a descrição
            não pode depender de um gesto que não existe.
          */}
          <div className="absolute inset-x-0 bottom-0 flex h-44 flex-col gap-1 bg-surface p-5 transition-transform duration-500 ease-out lg:translate-y-[6.5rem] lg:group-hover:translate-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Passo {numero}
            </span>
            <span className="font-display text-xl font-bold text-ink-900">{titulo}</span>
            <p className="text-sm leading-relaxed text-ink-500">{descricao}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

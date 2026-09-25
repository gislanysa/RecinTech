/** Ícones SVG para cada passo */
const IconeExplorar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
)

const IconeEncontrar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)

const IconeConectar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
)

const ICONES = [IconeExplorar, IconeEncontrar, IconeConectar]

type Passo = {
  numero: string
  titulo: string
  descricao: string
}

const PASSOS: Passo[] = [
  {
    numero: '01',
    titulo: 'Explore livremente',
    descricao:
      'Pesquise e filtre soluções por tecnologias, segmentos e áreas de atuação mesmo sem cadastro. Crie sua conta gratuita para desbloquear os nomes e perfis completos.',
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

export default function PassosComoFunciona() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {PASSOS.map(({ numero, titulo, descricao }, i) => {
        const Icone = ICONES[i]
        return (
          <li
            key={numero}
            /* passos-bolha: classe que gerencia ::after + hover no CSS */
            className="passos-bolha group relative overflow-hidden rounded-card bg-surface px-8 py-12 shadow-[0_0_10px_rgba(0,0,0,0.1)] ring-1 ring-brand-100 transition-all duration-400 ease-in-out hover:scale-[1.02] hover:shadow-[0_5px_20px_rgba(0,0,0,0.15)] cursor-default"
          >
            {/* Badge numérico — bolha que expande no hover via ::after no CSS */}
            <div className="passos-bolha__badge" aria-hidden="true">
              <span className="font-display text-2xl font-semibold text-white">{numero}</span>
            </div>

            {/* Ícone */}
            <div className="passos-bolha__icone relative z-10 mb-5 w-10 text-brand-500 transition-colors duration-500 group-hover:text-white">
              <Icone />
            </div>

            {/* Título */}
            <p className="passos-bolha__texto relative z-10 mb-5 font-display text-xl font-extrabold text-ink-900 transition-colors duration-500 group-hover:text-white">
              {titulo}
            </p>

            {/* Descrição */}
            <p className="passos-bolha__texto relative z-10 text-sm leading-relaxed text-ink-500 transition-colors duration-500 group-hover:text-white/90">
              {descricao}
            </p>
          </li>
        )
      })}
    </ol>
  )
}


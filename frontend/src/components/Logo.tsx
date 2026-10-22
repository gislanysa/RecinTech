
export default function Logo({ sobreEscuro = false }: { sobreEscuro?: boolean }) {
  return (
    <span
      className={[
        'font-display text-lg font-bold tracking-tight',
        sobreEscuro ? 'text-white' : 'text-ink-900',
      ].join(' ')}
    >
      {/* Sobre o escuro o azul do header (brand-600) ficaria em 2,82:1 e
          reprovaria em AA; brand-400 é o tom mais próximo que passa. */}
      Rec<span className={sobreEscuro ? 'text-brand-400' : 'text-brand-600'}>In</span>Tech
    </span>
  )
}

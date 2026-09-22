/**
 * Marca da plataforma. `sobreEscuro` diz em que fundo ela está — o cabeçalho
 * alterna conforme fica transparente sobre o topo ou sólido ao rolar.
 */
export default function Logo({ sobreEscuro = false }: { sobreEscuro?: boolean }) {
  return (
    <span
      className={[
        'font-display text-lg font-bold tracking-tight',
        sobreEscuro ? 'text-white' : 'text-ink-900',
      ].join(' ')}
    >
      Rec<span className={sobreEscuro ? 'text-accent-300' : 'text-brand-600'}>In</span>Tech
    </span>
  )
}

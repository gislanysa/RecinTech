// Altura de 18px reproduz o tamanho do logotipo em texto da develop
// (font-display text-lg: ~90px de largura na proporção 879x174 da imagem).
export default function Logo({
  sobreEscuro = false,
  className = 'h-[18px] w-auto object-contain',
}: {
  sobreEscuro?: boolean
  className?: string
}) {
  return (
    <span className="inline-flex items-center">
      {/* Sobre fundo escuro, o azul-escuro de "Rec" e "tech" vira branco;
          o azul de "In" permanece o original. */}
      <img
        src={sobreEscuro ? '/logo-white.png' : '/logo.png'}
        alt="RecInTech"
        className={className}
      />
    </span>
  )
}

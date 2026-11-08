import { useEffect, useState } from 'react'

/** Intervalo entre as letras, em milissegundos. */
const RITMO = 45

function prefereMenosMovimento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Título com efeito de máquina de escrever que aceita quebra de linha.
 *
 * A animação de CSS usada em "Como funciona?" revela a largura do elemento,
 * o que obriga o texto a caber numa linha só. Serve para título curto e
 * estoura a tela com título longo.
 *
 * Aqui o texto é revelado letra a letra. Para o bloco não mudar de tamanho
 * enquanto digita, o texto completo fica no mesmo lugar com opacidade zero,
 * segurando o espaço, e a parte já digitada é desenhada por cima.
 *
 * A camada invisível é a que os leitores de tela anunciam, de uma vez só; a
 * camada animada fica escondida para eles. Quem configurou menos movimento no
 * sistema recebe o texto inteiro, sem animação.
 */
export default function TituloDigitando({
  texto,
  className = '',
}: {
  texto: string
  className?: string
}) {
  const [visiveis, setVisiveis] = useState(() => (prefereMenosMovimento() ? texto.length : 0))

  useEffect(() => {
    if (prefereMenosMovimento()) return

    let letra = 0
    const relogio = setInterval(() => {
      letra += 1
      setVisiveis(letra)
      if (letra >= texto.length) clearInterval(relogio)
    }, RITMO)

    return () => clearInterval(relogio)
  }, [texto])

  const terminou = visiveis >= texto.length

  return (
    <h1 className={className}>
      <span className="grid">
        <span className="col-start-1 row-start-1 opacity-0">{texto}</span>
        <span aria-hidden="true" className="col-start-1 row-start-1">
          {texto.slice(0, visiveis)}
          <span
            className={[
              'ml-0.5 inline-block w-0 border-r-2 border-brand-600 align-text-bottom',
              // O cursor pisca só depois que termina de digitar. Piscando
              // junto com as letras, ele compete com o texto surgindo.
              terminou ? 'animate-[cursor_700ms_step-end_infinite]' : '',
            ].join(' ')}
            style={{ height: '0.9em' }}
          />
        </span>
      </span>
    </h1>
  )
}

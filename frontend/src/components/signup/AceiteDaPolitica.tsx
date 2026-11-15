import { Link } from 'react-router-dom'

/**
 * Caixa de aceite da política de privacidade e dos termos, no cadastro.
 *
 * A LGPD espera que o consentimento seja colhido no momento da coleta, e não
 * depois, então marcar esta caixa é obrigatório para concluir o cadastro.
 *
 * Os links abrem em outra aba de propósito: quem clica para ler não deve
 * perder o formulário que já preencheu.
 */
export default function AceiteDaPolitica({
  marcado,
  onChange,
  erro,
  id = 'aceite-politica',
}: {
  marcado: boolean
  onChange: (marcado: boolean) => void
  erro?: string
  id?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={marcado}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="mt-0.5 size-4 shrink-0 rounded border-brand-300 text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
        />
        <span className="text-sm leading-relaxed text-ink-700">
          Li e concordo com a{' '}
          <Link
            to="/privacidade"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            política de privacidade
          </Link>{' '}
          e com os{' '}
          <Link
            to="/termos"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            termos de uso
          </Link>
          , e autorizo o tratamento dos meus dados conforme descrito neles.
        </span>
      </label>

      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-accent-700">
          {erro}
        </p>
      )}
    </div>
  )
}

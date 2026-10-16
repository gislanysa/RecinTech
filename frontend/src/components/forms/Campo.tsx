import { useState } from 'react'

const BASE_INPUT = [
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none',
  'placeholder:text-ink-500/60 transition-shadow duration-150',
  'focus:ring-2 focus:ring-accent-500 focus:border-transparent',
].join(' ')

function bordaDoErro(error?: string) {
  return error ? 'border-red-400 ring-1 ring-red-400' : 'border-brand-200 hover:border-brand-300'
}

function Rotulo({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id} className="text-sm font-medium text-ink-700">
      {label}
      {required && (
        <span className="ml-0.5 text-accent-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

function MensagemErro({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} role="alert" className="text-xs text-red-500">
      {error}
    </p>
  )
}

type CampoProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: string
  placeholder?: string
  type?: string
  dica?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  alternarSenha?: boolean
}

export function Campo({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  type = 'text',
  dica,
  inputMode,
  autoComplete,
  alternarSenha = false,
}: CampoProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const temToggle = type === 'password' && alternarSenha
  const inputType = temToggle && mostrarSenha ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5">
      <Rotulo id={id} label={label} required={required} />
      <div className="relative">
        <input
          id={id}
          type={inputType}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          aria-describedby={error ? `${id}-error` : dica ? `${id}-dica` : undefined}
          aria-invalid={!!error}
          className={[BASE_INPUT, temToggle ? 'pr-11' : '', bordaDoErro(error)].join(' ')}
        />
        {temToggle && (
          <button
            type="button"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-ink-500 transition-colors hover:text-ink-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              {mostrarSenha ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {dica && !error && (
        <p id={`${id}-dica`} className="text-xs text-ink-500">
          {dica}
        </p>
      )}
      <MensagemErro id={id} error={error} />
    </div>
  )
}

type CampoSelectProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: string
  opcoes: readonly string[]
  valores?: readonly string[]
  placeholder?: string
}

export function CampoSelect({
  id,
  label,
  value,
  onChange,
  required,
  error,
  opcoes,
  valores,
  placeholder,
}: CampoSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Rotulo id={id} label={label} required={required} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          'rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none',
          'transition-shadow duration-150 cursor-pointer',
          'focus:ring-2 focus:ring-accent-500 focus:border-transparent',
          value === '' ? 'text-ink-500/60' : 'text-ink-900',
          bordaDoErro(error),
        ].join(' ')}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {opcoes.map((opcao, i) => (
          <option key={opcao} value={valores ? valores[i] : opcao}>
            {opcao}
          </option>
        ))}
      </select>
      <MensagemErro id={id} error={error} />
    </div>
  )
}

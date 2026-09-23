import { ArrowRightIcon } from '@/components/icons.tsx'
import { login } from '@/lib/api.ts'
import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Campos = {
  email: string
  senha: string
}

const VAZIO: Campos = { email: '', senha: '' }

type Errors = Partial<Record<keyof Campos, string>>

function validar(campos: Campos): Errors {
  const erros: Errors = {}
  if (!campos.email.trim()) {
    erros.email = 'E-mail obrigatório.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) {
    erros.email = 'Informe um e-mail válido.'
  }
  if (!campos.senha) {
    erros.senha = 'Senha obrigatória.'
  } else if (campos.senha.length < 6) {
    erros.senha = 'A senha precisa ter pelo menos 6 caracteres.'
  }
  return erros
}

// ---------------------------------------------------------------------------
// Componente de campo de texto reutilizável
// ---------------------------------------------------------------------------

type CampoProps = {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  error?: string
  placeholder?: string
  type?: string
  autoComplete?: string
}

function Campo({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  type = 'text',
  autoComplete,
}: CampoProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const inputType = type === 'password' ? (mostrarSenha ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-accent-500" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          className={[
            'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none',
            'placeholder:text-ink-500/60 transition-shadow duration-150',
            'focus:ring-2 focus:ring-accent-500 focus:border-transparent',
            type === 'password' ? 'pr-11' : '',
            error
              ? 'border-red-400 ring-1 ring-red-400'
              : 'border-brand-200 hover:border-brand-300',
          ].join(' ')}
        />
        {type === 'password' && (
          <button
            type="button"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-ink-500 hover:text-ink-700 transition-colors"
          >
            {mostrarSenha ? (
              // senha está visível
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // senha está oculta
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formulário de login
// ---------------------------------------------------------------------------

export default function FormularioLogin() {
  const navigate = useNavigate()
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [errors, setErrors] = useState<Errors>({})
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo: keyof Campos, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    if (errors[campo]) setErrors((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erros = validar(campos)
    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      return
    }
    setEnviando(true)
    try {
      await login(campos.email, campos.senha)
      navigate('/dashboard/startup')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrors({ senha: 'E-mail ou senha incorretos.' })
      } else {
        setErrors({ senha: 'Erro ao conectar. Tente novamente.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="w-full">
      {/* Voltar */}
      <div className="mb-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar para a home
        </Link>
      </div>

      {/* Título */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Bem-vindo de volta
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Acesse sua conta para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Campo
          id="email"
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          value={campos.email}
          onChange={(v) => atualizar('email', v)}
          error={errors.email}
          placeholder="voce@empresa.com"
        />

        <Campo
          id="senha"
          label="Senha"
          required
          type="password"
          autoComplete="current-password"
          value={campos.senha}
          onChange={(v) => atualizar('senha', v)}
          error={errors.senha}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-end">
          <a
            href="/recuperar-senha"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Esqueceu a senha?
          </a>
        </div>

        <button
          id="btn-entrar"
          type="submit"
          disabled={enviando}
          className={[
            'mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3',
            'bg-brand-600 text-sm font-semibold text-white shadow-sm',
            'transition-all duration-200 hover:bg-brand-700 hover:-translate-y-px hover:shadow-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-60',
          ].join(' ')}
        >
          {enviando ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Ainda não tem conta?{' '}
        <Link to="/criar-conta" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

import Botao from '@/components/Botao.tsx'
import { Campo } from '@/components/forms/Campo.tsx'
import { login } from '@/lib/api.ts'
import { email, minimo, obrigatorio, validarCampos, type Regras } from '@/lib/validacao.ts'
import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Campos = {
  email: string
  senha: string
}

const VAZIO: Campos = { email: '', senha: '' }

type Errors = Partial<Record<keyof Campos, string>>

const REGRAS: Regras<Campos> = {
  email: [obrigatorio('E-mail obrigatório.'), email('Informe um e-mail válido.')],
  senha: [
    obrigatorio('Senha obrigatória.', false),
    minimo(8, 'A senha precisa ter pelo menos 8 caracteres.'),
  ],
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
    const erros = validarCampos(campos, REGRAS)
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
          alternarSenha
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

        <div className="mt-2">
          <Botao id="btn-entrar" type="submit" disabled={enviando} bloco>
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
              </>
            )}
          </Botao>
        </div>
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

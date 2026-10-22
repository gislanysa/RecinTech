import Botao from '@/components/Botao.tsx'
import BotaoVoltar from '@/components/BotaoVoltar.tsx'
import { Campo } from '@/components/forms/Campo.tsx'
import { CheckIcon } from '@/components/icons.tsx'
import { useAuth } from '@/contexts/useAuth.ts'
import { tipoDaConta, type TipoSessao } from '@/lib/api.ts'
import { email, minimo, obrigatorio, validarCampos, type Regras } from '@/lib/validacao.ts'
import axios from 'axios'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

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
  const { login: realizarLogin, logout: realizarLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const estadoNavegacao = location.state as {
    mensagemSucesso?: string
    tipo?: TipoSessao
    email?: string
  } | null

  const [campos, setCampos] = useState<Campos>(() => ({
    ...VAZIO,
    email: estadoNavegacao?.email ?? '',
  }))
  const [errors, setErrors] = useState<Errors>({})
  const [enviando, setEnviando] = useState(false)
  const [sessao, setSessao] = useState<TipoSessao>(() => estadoNavegacao?.tipo ?? 'startup')
  const [alertaSucesso] = useState<string | null>(
    () => estadoNavegacao?.mensagemSucesso ?? null,
  )

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
      const conta = await realizarLogin(campos.email, campos.senha, sessao)
      const rotulo = sessao === 'company' ? 'empresa' : 'startup'
      if (tipoDaConta(conta) !== sessao) {
        // Garante que nenhuma sessão fique ativa com o tipo errado.
        await realizarLogout().catch(() => undefined)
        setErrors({ email: `Não existe ${rotulo} cadastrada com este e-mail. Verifique o tipo de conta selecionado.` })
        return
      }
      navigate(sessao === 'company' ? '/dashboard/empresa' : '/dashboard/startup')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrors({ senha: 'E-mail ou senha incorretos para o tipo de conta selecionado.' })
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
        <BotaoVoltar to="/">Voltar para a home</BotaoVoltar>
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

      {alertaSucesso && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-800"
        >
          <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-emerald-900">{alertaSucesso}</p>
            <p className="mt-0.5 text-emerald-700">Informe sua senha para entrar na plataforma.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div
          role="radiogroup"
          aria-label="Tipo de conta"
          className="grid grid-cols-2 gap-1 rounded-xl bg-brand-50 p-1"
        >
          {([
            ['startup', 'Startup'],
            ['company', 'Empresa'],
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              id={`sessao-${valor}`}
              type="button"
              role="radio"
              aria-checked={sessao === valor}
              onClick={() => setSessao(valor)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                sessao === valor
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-ink-500 hover:text-brand-600'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

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
          <Link
            to="/recuperar-senha"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Esqueceu a senha?
          </Link>
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

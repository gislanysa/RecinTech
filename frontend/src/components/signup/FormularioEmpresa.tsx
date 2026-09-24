import Botao from '@/components/Botao.tsx'
import { registrarUsuario } from '@/lib/api.ts'
import { UFS } from '@/lib/ufs.ts'
import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type FormularioEmpresaProps = {
  onVoltar: () => void
}

const SETORES = [
  'Agronegócio',
  'Construção Civil',
  'Educação',
  'Energia',
  'Finanças e Seguros',
  'Indústria e Manufatura',
  'Logística e Transporte',
  'Mineração',
  'Saúde',
  'Serviços',
  'Tecnologia',
  'Varejo e Consumo',
  'Outro',
]

const TAMANHOS = [
  { valor: 'micro', rotulo: 'Microempresa — até 9 colaboradores' },
  { valor: 'pequena', rotulo: 'Pequena — 10 a 49 colaboradores' },
  { valor: 'media', rotulo: 'Média — 50 a 249 colaboradores' },
  { valor: 'grande', rotulo: 'Grande — 250 ou mais colaboradores' },
]

type Campos = {
  nomeEmpresa: string
  cnpj: string
  setor: string
  tamanho: string
  cidade: string
  estado: string
  site: string
  nomeResponsavel: string
  email: string
  senha: string
  confirmarSenha: string
}

const VAZIO: Campos = {
  nomeEmpresa: '',
  cnpj: '',
  setor: '',
  tamanho: '',
  cidade: '',
  estado: '',
  site: '',
  nomeResponsavel: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

/** Formata CNPJ enquanto digita: XX.XXX.XXX/XXXX-XX */
function formatarCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '').slice(0, 14)
  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/**
 * Formulário de cadastro para empresas.
 *
 * TODO (backend): integrar com POST /auth/cadastro/empresa
 * Body esperado:
 * {
 *   tipo: "empresa",
 *   nome_empresa: string,
 *   cnpj: string,           // apenas dígitos
 *   setor: string,
 *   tamanho: "micro" | "pequena" | "media" | "grande",
 *   site?: string,
 *   nome_responsavel: string,
 *   email: string,
 *   senha: string
 * }
 * Resposta: { token: string, usuario: { id, tipo, nome } }
 */
export default function FormularioEmpresa({ onVoltar }: FormularioEmpresaProps) {
  const navigate = useNavigate()
  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [errors, setErrors] = useState<Partial<Campos>>({})
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo: keyof Campos, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    if (errors[campo]) setErrors((prev) => ({ ...prev, [campo]: '' }))
  }

  function validar(): boolean {
    const novosErros: Partial<Campos> = {}
    if (!campos.nomeEmpresa.trim()) novosErros.nomeEmpresa = 'Informe o nome da empresa.'
    const cnpjDigitos = campos.cnpj.replace(/\D/g, '')
    if (!cnpjDigitos) novosErros.cnpj = 'Informe o CNPJ.'
    else if (cnpjDigitos.length !== 14) novosErros.cnpj = 'CNPJ deve ter 14 dígitos.'
    if (!campos.setor) novosErros.setor = 'Selecione o setor.'
    if (!campos.tamanho) novosErros.tamanho = 'Selecione o tamanho.'
    if (!campos.cidade.trim()) novosErros.cidade = 'Informe a cidade.'
    if (!campos.estado) novosErros.estado = 'Selecione o estado.'
    if (!campos.nomeResponsavel.trim()) novosErros.nomeResponsavel = 'Informe o nome do responsável.'
    if (!campos.email.trim()) novosErros.email = 'Informe o e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) novosErros.email = 'E-mail inválido.'
    if (!campos.senha) novosErros.senha = 'Crie uma senha.'
    else if (campos.senha.length < 8) novosErros.senha = 'A senha deve ter pelo menos 8 caracteres.'
    if (campos.senha !== campos.confirmarSenha) novosErros.confirmarSenha = 'As senhas não coincidem.'
    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)

    try {
      // Registra o usuário responsável pela empresa.
      //     Backend: quando houver um model de Investor/Empresa, criar
      //     também POST /investor com os dados abaixo.
      await registrarUsuario({
        full_name: campos.nomeResponsavel,
        email: campos.email,
        password: campos.senha,
      })

      navigate('/dashboard/empresa')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg: string = err.response?.data ?? ''
        if (err.response?.status === 409 && msg.includes('Email')) {
          setErrors((prev) => ({ ...prev, email: 'Este e-mail já está em uso.' }))
        } else if (err.response?.status === 409 && msg.includes('CNPJ')) {
          setErrors((prev) => ({ ...prev, cnpj: 'Este CNPJ já está cadastrado.' }))
        } else {
          setErrors((prev) => ({ ...prev, email: 'Erro ao cadastrar. Tente novamente.' }))
        }
      } else {
        setErrors((prev) => ({ ...prev, email: 'Erro ao conectar. Tente novamente.' }))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <button
          type="button"
          onClick={onVoltar}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar
        </button>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Cadastro de Empresa
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Dados da empresa */}
        <fieldset className="flex flex-col gap-4">

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="nomeEmpresa"
              label="Nome da empresa"
              required
              value={campos.nomeEmpresa}
              onChange={(v) => atualizar('nomeEmpresa', v)}
              error={errors.nomeEmpresa}
              placeholder="Ex.: Empresa S.A."
            />
            <Campo
              id="cnpj"
              label="CNPJ"
              required
              value={campos.cnpj}
              onChange={(v) => atualizar('cnpj', formatarCnpj(v))}
              error={errors.cnpj}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              id="setor"
              label="Setor de atuação"
              required
              value={campos.setor}
              onChange={(v) => atualizar('setor', v)}
              error={errors.setor}
              opcoes={SETORES}
              placeholder="Selecione"
            />
            <CampoSelect
              id="tamanho"
              label="Tamanho"
              required
              value={campos.tamanho}
              onChange={(v) => atualizar('tamanho', v)}
              error={errors.tamanho}
              opcoes={TAMANHOS.map((t) => t.rotulo)}
              valores={TAMANHOS.map((t) => t.valor)}
              placeholder="Selecione"
            />
          </div>

          <Campo
            id="site"
            label="Site corporativo"
            value={campos.site}
            onChange={(v) => atualizar('site', v)}
            placeholder="https://empresa.com.br"
            type="url"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="cidade"
              label="Cidade"
              required
              value={campos.cidade}
              onChange={(v) => atualizar('cidade', v)}
              error={errors.cidade}
              placeholder="Ex.: Recife"
            />
            <CampoSelect
              id="estado"
              label="Estado"
              required
              value={campos.estado}
              onChange={(v) => atualizar('estado', v)}
              error={errors.estado}
              opcoes={UFS.map((uf) => uf.rotulo)}
              valores={UFS.map((uf) => uf.valor)}
              placeholder="Selecione"
            />
          </div>
        </fieldset>

        {/* Dados do responsável */}
        <fieldset className="flex flex-col gap-4 border-t border-brand-100 pt-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
            Responsável
          </legend>

          <Campo
            id="nomeResponsavel"
            label="Seu nome"
            required
            value={campos.nomeResponsavel}
            onChange={(v) => atualizar('nomeResponsavel', v)}
            error={errors.nomeResponsavel}
            placeholder="João da Silva"
          />

          <Campo
            id="email"
            label="E-mail corporativo"
            type="email"
            required
            value={campos.email}
            onChange={(v) => atualizar('email', v)}
            error={errors.email}
            placeholder="joao@empresa.com.br"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="senha"
              label="Senha"
              type="password"
              required
              value={campos.senha}
              onChange={(v) => atualizar('senha', v)}
              error={errors.senha}
              placeholder="Mínimo 8 caracteres"
              dica="Pelo menos 8 caracteres"
            />
            <Campo
              id="confirmarSenha"
              label="Confirmar senha"
              type="password"
              required
              value={campos.confirmarSenha}
              onChange={(v) => atualizar('confirmarSenha', v)}
              error={errors.confirmarSenha}
              placeholder="Repita a senha"
            />
          </div>
        </fieldset>

        <div className="mt-2">
          <Botao id="btn-cadastrar-empresa" type="submit" disabled={enviando} bloco>
            {enviando ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Criando conta…
              </>
            ) : (
              <>
                Criar minha conta
              </>
            )}
          </Botao>
        </div>
      </form>
    </div>
  )
}

/* ---------- sub-componentes de campo ---------- */

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
}

function Campo({ id, label, value, onChange, required, error, placeholder, type = 'text', dica, inputMode }: CampoProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-accent-500" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        aria-describedby={error ? `${id}-error` : dica ? `${id}-dica` : undefined}
        aria-invalid={!!error}
        className={[
          'rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none',
          'placeholder:text-ink-500/60 transition-shadow duration-150',
          'focus:ring-2 focus:ring-accent-500 focus:border-transparent',
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : 'border-brand-200 hover:border-brand-300',
        ].join(' ')}
      />
      {dica && !error && (
        <p id={`${id}-dica`} className="text-xs text-ink-500">{dica}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-500">{error}</p>
      )}
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
  opcoes: string[]
  valores?: string[]
  placeholder?: string
}

function CampoSelect({ id, label, value, onChange, required, error, opcoes, valores, placeholder }: CampoSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-accent-500" aria-hidden="true">*</span>}
      </label>
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
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : 'border-brand-200 hover:border-brand-300',
        ].join(' ')}
      >
        <option value="" disabled>{placeholder}</option>
        {opcoes.map((opcao, i) => (
          <option key={opcao} value={valores ? valores[i] : opcao}>{opcao}</option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

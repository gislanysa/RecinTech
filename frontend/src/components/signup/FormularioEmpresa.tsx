import Botao from '@/components/Botao.tsx'
import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { UFS } from '@/lib/ufs.ts'
import {
  cnpjCom14Digitos,
  email,
  formatarCnpj,
  igualA,
  minimo,
  obrigatorio,
  validarCampos,
  type Regras,
} from '@/lib/validacao.ts'
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

const REGRAS: Regras<Campos> = {
  nomeEmpresa: obrigatorio('Informe o nome da empresa.'),
  setor: obrigatorio('Selecione o setor.'),
  tamanho: obrigatorio('Selecione o tamanho.'),
  cnpj: [obrigatorio('Informe o CNPJ.'), cnpjCom14Digitos('CNPJ deve ter 14 dígitos.')],
  cidade: obrigatorio('Informe a cidade.'),
  estado: obrigatorio('Selecione o estado.'),
  nomeResponsavel: obrigatorio('Informe o nome do responsável.'),
  email: [obrigatorio('Informe o e-mail.'), email('E-mail inválido.')],
  senha: [
    obrigatorio('Crie uma senha.', false),
    minimo(8, 'A senha deve ter pelo menos 8 caracteres.'),
  ],
  confirmarSenha: igualA('senha', 'As senhas não coincidem.'),
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
    const novosErros = validarCampos(campos, REGRAS)
    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)

    try {
      // Quando o backend expuser POST /investor, conectar a chamada aqui.
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

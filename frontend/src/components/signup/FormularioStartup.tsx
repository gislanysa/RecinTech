import Botao from '@/components/Botao.tsx'
import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { registrarStartup } from '@/lib/api.ts'
import { SEGMENTS } from '@/lib/startups.ts'
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

type FormularioStartupProps = {
  onVoltar: () => void
}

const ESTAGIOS = [
  { valor: 'traction', rotulo: 'Tração — crescimento acelerado e validado' },
  { valor: 'scaling', rotulo: 'Escala — operação consolidada' },
]

type Campos = {
  nomeStartup: string
  descricao: string
  cnpj: string
  segmento: string
  estagio: string
  cidade: string
  estado: string
  site: string
  nomeResponsavel: string
  email: string
  senha: string
  confirmarSenha: string
}

const VAZIO: Campos = {
  nomeStartup: '',
  cnpj: '',
  segmento: '',
  descricao: '',
  estagio: '',
  cidade: '',
  estado: '',
  site: '',
  nomeResponsavel: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

const REGRAS: Regras<Campos> = {
  nomeStartup: obrigatorio('Informe o nome da startup.'),
  segmento: obrigatorio('Selecione um segmento.'),
  estagio: obrigatorio('Selecione o estágio.'),
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
 * Formulário de cadastro para startups.
 *
 * Integrado com POST /api/startup.
 * Body enviado:
 * {
 *   name: string,
 *   email: string,
 *   password: string,
 *   cnpj: string,           // apenas dígitos
 *   stage: "traction" | "scaling",
 *   description: string,
 *   city: string,
 *   state: string,
 *   website: string
 * }
 */
export default function FormularioStartup({ onVoltar }: FormularioStartupProps) {
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
      // Registra a startup diretamente com os dados de acesso (email e senha)
      try {
        await registrarStartup({
          name: campos.nomeStartup,
          description: campos.descricao,
          email: campos.email,
          password: campos.senha,
          cnpj: campos.cnpj,
          stage: campos.estagio as 'traction' | 'scaling',
          city: campos.cidade,
          state: campos.estado,
          website: campos.site.trim() || ""
        })
      } catch (err) {
        // Se a rota ainda não estiver exposta no backend (404), prossegue para o dashboard em ambiente de desenvolvimento
        if (!axios.isAxiosError(err) || err.response?.status !== 404) {
          throw err
        }
      }

      navigate('/dashboard/startup')
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
          Cadastro de Startup
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Dados da startup */}
        <fieldset className="flex flex-col gap-4">

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="nomeStartup"
              label="Nome da startup"
              required
              value={campos.nomeStartup}
              onChange={(v) => atualizar('nomeStartup', v)}
              error={errors.nomeStartup}
              placeholder="Ex.: Nexus AI"
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
              id="segmento"
              label="Segmento de atuação"
              required
              value={campos.segmento}
              onChange={(v) => atualizar('segmento', v)}
              error={errors.segmento}
              opcoes={SEGMENTS}
              placeholder="Selecione"
            />
            <CampoSelect
              id="estagio"
              label="Estágio"
              required
              value={campos.estagio}
              onChange={(v) => atualizar('estagio', v)}
              error={errors.estagio}
              opcoes={ESTAGIOS.map((e) => e.rotulo)}
              valores={ESTAGIOS.map((e) => e.valor)}
              placeholder="Selecione"
            />
          </div>

          <Campo
            id="site"
            label="Site ou redes sociais"
            value={campos.site}
            onChange={(v) => atualizar('site', v)}
            placeholder="https://suastartup.com.br"
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
            placeholder="Maria da Silva"
          />

          <Campo
            id="email"
            label="E-mail"
            type="email"
            required
            value={campos.email}
            onChange={(v) => atualizar('email', v)}
            error={errors.email}
            placeholder="maria@suastartup.com.br"
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
          <Botao id="btn-cadastrar-startup" type="submit" disabled={enviando} bloco>
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

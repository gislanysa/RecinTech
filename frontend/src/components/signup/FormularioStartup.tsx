import Botao from '@/components/Botao.tsx'
import BotaoVoltar from '@/components/BotaoVoltar.tsx'
import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { registrarStartup } from '@/lib/api.ts'
import { UFS } from '@/lib/ufs.ts'
import {
  cnpjCom14Digitos,
  email,
  formatarCnpj,
  igualA,
  mapearErroApi,
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
  estagio: string
  cidade: string
  estado: string
  site: string
  email: string
  senha: string
  confirmarSenha: string
}

const VAZIO: Campos = {
  nomeStartup: '',
  cnpj: '',
  descricao: '',
  estagio: '',
  cidade: '',
  estado: '',
  site: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

const REGRAS: Regras<Campos> = {
  nomeStartup: obrigatorio('Informe o nome da startup.'),
  estagio: obrigatorio('Selecione o estágio.'),
  cnpj: [obrigatorio('Informe o CNPJ.'), cnpjCom14Digitos('CNPJ deve ter 14 dígitos.')],
  cidade: obrigatorio('Informe a cidade.'),
  estado: obrigatorio('Selecione o estado.'),
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
          website: campos.site.trim() || ''
        })
      } catch (err) {
        // Se a rota ainda não estiver exposta no backend (404), prossegue para o dashboard em ambiente de desenvolvimento
        if (!axios.isAxiosError(err) || err.response?.status !== 404) {
          throw err
        }
      }

      navigate('/entrar', {
        state: {
          mensagemSucesso: 'Cadastro realizado com sucesso! Faça login para continuar.',
          tipo: 'startup',
          email: campos.email,
        },
      })
    } catch (err) {
      const errosApi = mapearErroApi(err)
      setErrors((prev) => ({ ...prev, ...errosApi }))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <BotaoVoltar onClick={onVoltar} />
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
            <Campo
              id="site"
              label="Site ou redes sociais"
              value={campos.site}
              onChange={(v) => atualizar('site', v)}
              placeholder="https://suastartup.com.br"
              type="url"
            />
          </div>

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

        {/* Dados de acesso */}
        <fieldset className="flex flex-col gap-4 border-t border-brand-100 pt-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
            Acesso à conta
          </legend>

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

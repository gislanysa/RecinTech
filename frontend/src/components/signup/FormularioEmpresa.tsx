import Botao from '@/components/Botao.tsx'
import BotaoVoltar from '@/components/BotaoVoltar.tsx'
import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { registrarEmpresa, type TamanhoEmpresa } from '@/lib/api.ts'
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
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type FormularioEmpresaProps = {
  onVoltar: () => void
}

const TAMANHOS: { valor: TamanhoEmpresa; rotulo: string }[] = [
  { valor: 'micro', rotulo: 'Microempresa — até 9 colaboradores' },
  { valor: 'small', rotulo: 'Pequena — 10 a 49 colaboradores' },
  { valor: 'medium', rotulo: 'Média — 50 a 249 colaboradores' },
  { valor: 'big', rotulo: 'Grande — 250 ou mais colaboradores' },
]

type Campos = {
  nomeEmpresa: string
  cnpj: string
  tamanho: string
  cidade: string
  estado: string
  site: string
  email: string
  senha: string
  confirmarSenha: string
}

const VAZIO: Campos = {
  nomeEmpresa: '',
  cnpj: '',
  tamanho: '',
  cidade: '',
  estado: '',
  site: '',
  email: '',
  senha: '',
  confirmarSenha: '',
}

const REGRAS: Regras<Campos> = {
  nomeEmpresa: obrigatorio('Informe o nome da empresa.'),
  tamanho: obrigatorio('Selecione o tamanho.'),
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
 * Formulário de cadastro para empresas.
 *
 * Integrado com POST /company
 * Body: { name, size, email, password, cnpj, city, state, website }
 * size: "micro" | "small" | "medium" | "big"
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
      await registrarEmpresa({
        name: campos.nomeEmpresa,
        size: campos.tamanho as TamanhoEmpresa,
        email: campos.email,
        password: campos.senha,
        cnpj: campos.cnpj,
        city: campos.cidade,
        state: campos.estado,
        website: campos.site,
      })
      navigate('/dashboard/empresa')
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
            <Campo
              id="site"
              label="Site corporativo"
              value={campos.site}
              onChange={(v) => atualizar('site', v)}
              placeholder="https://empresa.com.br"
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

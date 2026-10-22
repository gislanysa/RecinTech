import axios from 'axios'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailValido(email: string): boolean {
  return REGEX_EMAIL.test(email)
}

/** Remove tudo que não for dígito. */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Formata CNPJ enquanto digita: XX.XXX.XXX/XXXX-XX */
export function formatarCnpj(valor: string): string {
  return apenasDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

// ---------------------------------------------------------------------------
// Validação declarativa de formulários
// ---------------------------------------------------------------------------

/** Devolve a mensagem de erro, ou `undefined` se o valor for válido. */
export type Regra<C> = (valor: string, campos: C) => string | undefined

/** Para cada campo, uma regra ou uma lista delas (a primeira que falhar vence). */
export type Regras<C> = { [K in keyof C]?: Regra<C> | Regra<C>[] }

export type Erros<C> = Partial<Record<keyof C, string>>

/** Aplica as regras e devolve só os campos com erro. */
export function validarCampos<C extends Record<keyof C, string>>(
  campos: C,
  regras: Regras<C>,
): Erros<C> {
  const erros: Erros<C> = {}

  for (const campo of Object.keys(regras) as (keyof C)[]) {
    const regra = regras[campo]
    const lista = Array.isArray(regra) ? regra : regra ? [regra] : []

    for (const verificar of lista) {
      const mensagem = verificar(campos[campo], campos)
      if (mensagem) {
        erros[campo] = mensagem
        break
      }
    }
  }

  return erros
}

/** Campo não pode ficar vazio. `aparar: false` aceita espaços (útil para senhas). */
export const obrigatorio =
  <C>(mensagem: string, aparar = true): Regra<C> =>
  (valor) =>
    (aparar ? valor.trim() : valor) ? undefined : mensagem

export const email =
  <C>(mensagem: string): Regra<C> =>
  (valor) =>
    emailValido(valor) ? undefined : mensagem

export const cnpjCom14Digitos =
  <C>(mensagem: string): Regra<C> =>
  (valor) =>
    apenasDigitos(valor).length === 14 ? undefined : mensagem

export const minimo =
  <C>(tamanho: number, mensagem: string): Regra<C> =>
  (valor) =>
    valor.length >= tamanho ? undefined : mensagem

/** O valor precisa ser igual ao de outro campo (ex.: confirmar senha). */
export const igualA =
  <C>(outro: keyof C, mensagem: string): Regra<C> =>
  (valor, campos) =>
    valor === campos[outro] ? undefined : mensagem

// ---------------------------------------------------------------------------
// Tratamento de erros da API
// ---------------------------------------------------------------------------

/**
 * Converte erros HTTP da API (especialmente 409 Conflito para Email ou CNPJ duplicados)
 * em mensagens amigáveis para os campos do formulário.
 */
export function mapearErroApi(err: unknown): Partial<{ email: string; cnpj: string }> {
  if (axios.isAxiosError(err)) {
    const msg: string = typeof err.response?.data === 'string' ? err.response.data : ''
    if (err.response?.status === 409) {
      if (msg.includes('Email')) {
        return { email: 'Este e-mail já está em uso.' }
      }
      if (msg.includes('CNPJ')) {
        return { cnpj: 'Este CNPJ já está cadastrado.' }
      }
    }
    return { email: 'Erro ao cadastrar. Tente novamente.' }
  }
  return { email: 'Erro ao conectar. Tente novamente.' }
}

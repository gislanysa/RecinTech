/**
 * Versão e data dos documentos legais.
 *
 * O banco controla o consentimento por versão de política
 * (`startup_lgpd_consent.policy_version` e o equivalente de empresa), então
 * este número é o que será enviado quando a rota de consentimento existir.
 *
 * Ao mudar o texto da política ou dos termos de forma relevante, suba a
 * versão. Consentimentos registrados em versões anteriores deixam de valer, e
 * é isso que a LGPD espera.
 */
export const VERSAO_DA_POLITICA = 1

/** Data da versão em vigor, no formato que a interface exibe. */
export const DATA_DA_POLITICA = '8 de novembro de 2026'

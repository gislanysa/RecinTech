import Logo from '@/components/Logo.tsx'
import { Link } from 'react-router-dom'

const COLUNAS = [
  {
    titulo: 'Plataforma',
    links: [
      { label: 'Explorar startups', to: '/startups' },
      { label: 'Para empresas', to: '/para-empresas' },
      { label: 'Para startups', to: '/para-startups' },
    ],
  },
  {
    titulo: 'Empresas',
    links: [
      { label: 'Criar conta', to: '/criar-conta' },
      { label: 'Cadastrar necessidade', to: '/demandas/nova' },
      { label: 'Painel da empresa', to: '/painel' },
    ],
  },
  {
    titulo: 'Privacidade',
    links: [
      { label: 'Política de privacidade', to: '/privacidade' },
      { label: 'Termos de uso', to: '/termos' },
      { label: 'Seus dados', to: '/privacidade/dados' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo sobreEscuro />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">
              A ponte entre empresas que precisam de soluções e as startups do Porto Digital que
              já as constroem.
            </p>
          </div>

          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo}>
              <h2 className="font-display text-sm font-semibold text-white">{coluna.titulo}</h2>
              <ul className="mt-4 space-y-3">
                {coluna.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-brand-200 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-brand-600 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-brand-300">© 2026 RecInTech</p>
          <p className="text-xs text-brand-300">
            Projeto Integrador Multidisciplinar · Faculdade Senac de Pernambuco
          </p>
        </div>
      </div>
    </footer>
  )
}

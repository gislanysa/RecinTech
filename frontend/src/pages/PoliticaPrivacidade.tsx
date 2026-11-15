import PaginaLegal, {
  Destaque,
  ListaLegal,
  SecaoLegal,
} from '@/components/layout/PaginaLegal.tsx'
import { Link } from 'react-router-dom'

/**
 * Política de privacidade.
 *
 * O conteúdo descreve o que o sistema realmente coleta e faz, conferido no
 * banco e nas rotas, e não um texto genérico. Onde algo ainda não existe, o
 * texto diz que não existe, em vez de prometer.
 */
export default function PoliticaPrivacidade() {
  return (
    <PaginaLegal
      titulo="Política de privacidade"
      resumo="O que coletamos, por que coletamos, o que fica visível para outras pessoas e o que você pode exigir de nós."
    >
      <Destaque>
        O RecInTech é um projeto acadêmico, desenvolvido no Projeto Integrador Multidisciplinar da
        Faculdade Senac de Pernambuco. Não é um serviço comercial, e está em desenvolvimento. Leve
        isso em conta ao cadastrar informações reais.
      </Destaque>

      <SecaoLegal titulo="1. Quem trata os seus dados">
        <p>
          O tratamento é feito pela equipe do projeto RecInTech, formada por estudantes da
          Faculdade Senac de Pernambuco. Não há empresa constituída por trás da plataforma, nem
          transferência de dados para terceiros.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="2. Quais dados coletamos">
        <p>Coletamos apenas o que a plataforma usa para funcionar.</p>

        <p className="font-medium text-ink-900">De uma startup, no cadastro:</p>
        <ListaLegal
          itens={[
            'Nome da startup',
            'CNPJ',
            'E-mail, que também é o identificador de acesso',
            'Senha, armazenada apenas como hash',
            'Estágio da startup',
            'Cidade e estado',
            'Site ou rede social, quando informado',
            'Descrição da startup, quando informada',
          ]}
        />

        <p className="font-medium text-ink-900">De uma empresa, no cadastro:</p>
        <ListaLegal
          itens={[
            'Nome da empresa',
            'CNPJ',
            'Porte da empresa',
            'E-mail, que também é o identificador de acesso',
            'Senha, armazenada apenas como hash',
            'Cidade e estado',
            'Site, quando informado',
          ]}
        />

        <p className="font-medium text-ink-900">Depois do cadastro, se você quiser:</p>
        <ListaLegal
          itens={[
            'Áreas de atuação, serviços, tecnologias e segmentos da startup',
            'Descrição das necessidades da empresa',
          ]}
        />

        <p>
          Não coletamos dados sensíveis, não pedimos documentos de pessoa física, não usamos
          rastreadores de terceiros e não fazemos perfilamento publicitário.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="3. Para que usamos">
        <ListaLegal
          itens={[
            'Permitir que você entre na sua conta e seja reconhecido entre as páginas',
            'Exibir o perfil da startup para empresas que procuram soluções',
            'Aproximar empresas e startups a partir das áreas, serviços e tecnologias declarados',
            'Manter o funcionamento da plataforma e corrigir problemas',
          ]}
        />
        <p>
          Não vendemos dados, não enviamos publicidade e não compartilhamos informações com
          empresas fora da plataforma.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="4. O que fica visível para outras pessoas">
        <p>
          Esta é a parte que mais importa saber antes de se cadastrar, então vamos ser específicos.
        </p>

        <p className="font-medium text-ink-900">O perfil público da startup mostra:</p>
        <ListaLegal
          itens={[
            'Nome da startup',
            'Área de atuação',
            'Cidade e estado',
            'Site, quando informado',
            'Descrição',
            'Serviços, tecnologias e segmentos marcados',
          ]}
        />

        <p className="font-medium text-ink-900">O perfil público não mostra:</p>
        <ListaLegal
          itens={[
            'E-mail de cadastro',
            'CNPJ',
            'Senha, que nem a equipe consegue ler',
          ]}
        />

        <p>
          As necessidades cadastradas por empresas circulam apenas dentro da área autenticada da
          plataforma, e não aparecem em páginas públicas nem em mecanismos de busca.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="5. Como protegemos">
        <ListaLegal
          itens={[
            'Senhas são guardadas apenas como hash, com o algoritmo Argon2id. Nem a equipe do projeto consegue recuperar a senha original.',
            'A sessão é mantida por um cookie assinado pelo servidor, e não por um identificador acessível a scripts da página.',
            'O acesso às telas internas exige sessão válida, verificada a cada abertura.',
          ]}
        />
      </SecaoLegal>

      <SecaoLegal titulo="6. Cookies">
        <p>
          Usamos um único cookie, o de sessão, que existe para manter você conectado enquanto
          navega. Ele não acompanha você fora da plataforma, não alimenta anúncios e desaparece
          quando você sai da conta.
        </p>
        <p>Não usamos cookies de análise, de publicidade nem de terceiros.</p>
      </SecaoLegal>

      <SecaoLegal titulo="7. Por quanto tempo guardamos">
        <p>
          Enquanto a sua conta existir. Por ser um projeto acadêmico com prazo definido, os dados
          também podem ser apagados ao fim do semestre letivo, junto com o ambiente do projeto.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="8. Seus direitos">
        <p>
          A Lei Geral de Proteção de Dados garante a você, entre outros direitos, confirmar se
          tratamos seus dados, acessá-los, corrigir o que estiver errado, pedir a exclusão,
          revogar o consentimento e saber com quem compartilhamos.
        </p>

        <Destaque>
          Parte desses direitos ainda não está disponível na interface. A exportação dos seus
          dados, a exclusão da conta e a revogação do consentimento estão em desenvolvimento.
          Enquanto não existirem como botão, o pedido pode ser feito pelo contato abaixo e será
          atendido manualmente pela equipe.
        </Destaque>
      </SecaoLegal>

      <SecaoLegal titulo="9. Contato">
        <p>
          Para exercer qualquer direito, tirar dúvidas ou relatar um problema de privacidade, fale
          com a equipe do projeto pelo repositório público em{' '}
          <a
            href="https://github.com/gislanysa/RecinTech"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            github.com/gislanysa/RecinTech
          </a>
          , ou com o docente responsável pela disciplina.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="10. Mudanças nesta política">
        <p>
          Se o texto mudar de forma relevante, a versão sobe e o consentimento registrado em
          versões anteriores deixa de valer, pedindo nova confirmação. A versão em vigor aparece no
          topo desta página.
        </p>
        <p>
          Veja também os{' '}
          <Link
            to="/termos"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            termos de uso
          </Link>
          .
        </p>
      </SecaoLegal>
    </PaginaLegal>
  )
}

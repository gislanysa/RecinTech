import PaginaLegal, {
  Destaque,
  ListaLegal,
  SecaoLegal,
} from '@/components/layout/PaginaLegal.tsx'
import { Link } from 'react-router-dom'

/**
 * Termos de uso.
 *
 * Escritos a partir do que a plataforma faz hoje. Onde algo ainda não existe,
 * como a cobrança de plano, o texto diz que não existe em vez de prometer.
 */
export default function TermosDeUso() {
  return (
    <PaginaLegal
      titulo="Termos de uso"
      resumo="As regras para usar o RecInTech, o que esperamos de você e o que você pode esperar de nós."
    >
      <Destaque>
        O RecInTech é um projeto acadêmico do Projeto Integrador Multidisciplinar da Faculdade
        Senac de Pernambuco. Não é um serviço comercial, não há empresa constituída por trás dele e
        não há garantia de disponibilidade nem de continuidade depois do semestre letivo.
      </Destaque>

      <SecaoLegal titulo="1. Ao usar, você concorda">
        <p>
          Criar uma conta ou navegar pela plataforma significa que você leu e aceita estes termos e
          a{' '}
          <Link
            to="/privacidade"
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            política de privacidade
          </Link>
          . Se não concordar com algum ponto, não use a plataforma.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="2. O que a plataforma é">
        <p>
          O RecInTech aproxima empresas que precisam de soluções tecnológicas de startups do Porto
          Digital que as desenvolvem. A empresa descreve o que precisa, a startup mantém um perfil
          técnico, e a plataforma sugere aproximações.
        </p>
        <p className="font-medium text-ink-900">O que a plataforma não é:</p>
        <ListaLegal
          itens={[
            'Não somos parte de nenhum contrato fechado entre empresa e startup',
            'Não intermediamos pagamento entre as partes',
            'Não garantimos a qualidade, a capacidade técnica nem a idoneidade de quem se cadastra',
            'Não verificamos a veracidade das informações preenchidas nos perfis',
          ]}
        />
        <p>
          A negociação, o contrato e a entrega acontecem diretamente entre as partes, por conta e
          risco delas.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="3. Quem pode usar">
        <p>
          A plataforma é destinada a startups e empresas, representadas por pessoas maiores de 18
          anos com poderes para agir em nome delas. É necessário informar um CNPJ válido no
          cadastro.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="4. Sua conta">
        <ListaLegal
          itens={[
            'As informações que você cadastra devem ser verdadeiras e atualizadas',
            'A senha é pessoal, e você responde pelo que for feito com a sua conta',
            'Avise a equipe se suspeitar que alguém acessou sua conta sem autorização',
          ]}
        />
        <Destaque>
          A edição dos dados cadastrais ainda não está disponível na interface. Se precisar
          corrigir alguma informação, fale com a equipe pelo repositório do projeto.
        </Destaque>
      </SecaoLegal>

      <SecaoLegal titulo="5. O conteúdo que você publica">
        <p>
          Você continua dono do que escreve no perfil da sua startup ou na descrição das suas
          necessidades. Ao publicar, você autoriza a plataforma a exibir esse conteúdo às outras
          pessoas cadastradas, conforme descrito na política de privacidade.
        </p>
        <p>
          Você é responsável por não publicar informação sigilosa, dado pessoal de terceiros sem
          autorização, nem conteúdo que viole direito de outra pessoa.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="6. O que não é permitido">
        <ListaLegal
          itens={[
            'Se passar por outra pessoa, startup ou empresa',
            'Cadastrar informação falsa, inclusive CNPJ que não lhe pertence',
            'Coletar dados de outras pessoas da plataforma de forma automatizada',
            'Usar a plataforma para enviar propaganda não solicitada',
            'Tentar burlar o controle de acesso ou interferir no funcionamento do serviço',
          ]}
        />
        <p>
          A equipe pode suspender ou remover contas que descumpram estas regras, sem aviso prévio.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="7. Planos e cobrança">
        <p>
          A plataforma apresenta um plano gratuito e um plano premium. <strong>No momento não há
          cobrança de nenhuma espécie</strong>: não existe meio de pagamento integrado e todas as
          contas usam o plano gratuito.
        </p>
        <p>
          Se a cobrança passar a existir, estes termos serão atualizados e ninguém será cobrado sem
          contratar expressamente.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="8. Disponibilidade">
        <p>
          Por ser um projeto acadêmico em desenvolvimento, a plataforma pode sair do ar, perder
          dados, mudar de comportamento ou ser descontinuada ao fim do semestre letivo, sem aviso
          prévio e sem obrigação de restaurar nada.
        </p>
        <p>Não guarde na plataforma a única cópia de nenhuma informação que importe para você.</p>
      </SecaoLegal>

      <SecaoLegal titulo="9. Limites de responsabilidade">
        <p>
          A plataforma é oferecida no estado em que se encontra. A equipe do projeto não responde
          por prejuízo decorrente do uso, de indisponibilidade, de perda de dados, nem de qualquer
          relação comercial firmada entre empresa e startup a partir de um contato iniciado aqui.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="10. Encerramento">
        <p>
          Você pode pedir o encerramento da sua conta a qualquer momento. A equipe pode encerrar
          contas em caso de descumprimento destes termos, ou ao fim do projeto.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="11. Lei aplicável">
        <p>
          Estes termos são regidos pela lei brasileira, e fica eleito o foro da comarca de Recife,
          Pernambuco, para resolver qualquer questão deles decorrente.
        </p>
      </SecaoLegal>

      <SecaoLegal titulo="12. Mudanças nestes termos">
        <p>
          Se o texto mudar de forma relevante, a versão sobe e aparece no topo desta página. O uso
          continuado depois da mudança significa que você aceita a nova versão.
        </p>
      </SecaoLegal>
    </PaginaLegal>
  )
}

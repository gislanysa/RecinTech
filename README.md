# RecInTech

- **Disciplina:** `Projeto Integrador Multidisciplinar`
- **Instituição:** `Faculdade Senac de Pernambuco`
- **Período:** `2026.2`

## O que é o projeto

Plataforma que conecta empresas que precisam de soluções tecnológicas às startups do Porto Digital (Recife/PE) que já as constroem.

A empresa descreve o que precisa, a startup mantém um perfil técnico com suas áreas, serviços e tecnologias, e a plataforma aproxima os dois lados. O produto é entregue como SaaS.

> **Nota:** o projeto nasceu com o nome StartAI, voltado a mentores e investidores anjo. Em 2026.2 a equipe redirecionou o produto para a relação entre empresas e startups, e renomeou para RecInTech. Partes antigas da documentação e do código podem ainda usar a nomenclatura anterior.

## Stack

**Frontend**

| Camada | Tecnologia |
| --- | --- |
| Biblioteca de UI | React 19 |
| Build e servidor de desenvolvimento | Vite 8 |
| Linguagem | TypeScript 6 |
| Estilos | Tailwind CSS 4 |
| Roteamento | React Router 7 |
| Cliente HTTP | Axios |
| Testes | Vitest e Testing Library |
| Linter | oxlint |

**Backend**

| Camada | Tecnologia |
| --- | --- |
| Linguagem | Gleam |
| Runtime | BEAM VM (Erlang), com árvore de supervisão OTP |
| Servidor HTTP | Mist |
| Framework web | Wisp |
| Acesso a dados | pog (cliente PostgreSQL) e Squirrel (SQL com tipagem) |
| Hash de senha | argus (Argon2id) |
| Banco | PostgreSQL 18 |

Gleam é uma linguagem funcional de tipagem estática que compila para Erlang e roda na BEAM. A escolha traz tipagem forte de ponta a ponta, TypeScript no front e Gleam no back, mais o modelo de concorrência do BEAM. Em contrapartida o ecossistema é jovem: não há ORM, então o acesso a dados é SQL escrito à mão e tipado pelo Squirrel.

**Infraestrutura**

- Docker e Docker Compose para orquestração local
- Volume Docker para persistência do Postgres
- `just` como atalho para as tarefas de desenvolvimento (opcional)

---

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20 ou superior, para o frontend em modo de desenvolvimento
- Git

### Subindo o backend e o banco

```bash
git clone https://github.com/gislanysa/RecinTech.git
cd RecinTech
docker compose up -d
```

Na primeira vez demora: o Postgres é baixado e o backend em Gleam é compilado dentro do container.

Para confirmar que subiu:

```bash
curl http://localhost:8000/api/healthcheck
```

### Subindo o frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:8000`, então não há CORS em desenvolvimento.

### Serviços

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação da API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

### Variáveis de ambiente

Definidas no `docker-compose.yaml`, sem necessidade de `.env` para rodar local:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `SECRET_KEY` | Chave usada pelo Wisp para assinar cookies de sessão |

No frontend, `VITE_API_URL` pode apontar a API em produção. Sem ela, o cliente usa `/api` e o proxy do Vite.

### Comandos do frontend

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # checagem de tipos e build de produção
npm run test     # testes com Vitest
npm run lint     # oxlint
```

---

## Autenticação

A sessão é mantida por **cookie** definido pelo backend, não por token no cabeçalho. O Axios envia o cookie automaticamente, com `withCredentials: true`.

O login recebe o tipo de conta (`startup` ou `company`) e valida se a conta devolvida corresponde ao tipo escolhido. Rotas privadas são protegidas no frontend por `RotaProtegida`, que consulta `GET /api/auth/restore` antes de renderizar.

---

## API

Rotas implementadas no backend hoje. Todas sob o prefixo `/api`.

### Saúde

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/healthcheck` | Verifica se o servidor responde |

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/login` | Autentica e define o cookie de sessão |
| GET | `/api/auth/restore` | Restaura a sessão a partir do cookie |
| GET | `/api/auth/refresh` | Renova a duração do token |
| POST | `/api/auth/logout` | Encerra a sessão |

### Startups

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/startup` | Registra uma startup |
| GET | `/api/startup?limit=&offset=` | Lista startups. Os dois parâmetros são obrigatórios |
| GET | `/api/startup/:id` | Busca uma startup |
| GET | `/api/startup/:id/segment` | Segmentos da startup |
| GET | `/api/startup/:id/service` | Serviços da startup |
| GET | `/api/startup/:id/expertise` | Áreas de atuação da startup |
| GET | `/api/startup/:id/technology` | Tecnologias da startup |
| POST | `/api/startup/segment` | Associa um segmento à startup |
| POST | `/api/startup/service` | Associa um serviço à startup |
| POST | `/api/startup/expertise` | Associa uma área de atuação à startup |
| POST | `/api/startup/technology` | Associa uma tecnologia à startup |

### Empresas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/company` | Registra uma empresa |
| GET | `/api/company/:id` | Busca uma empresa |

### Catálogos

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/segment?limit=&offset=` | Lista os segmentos cadastrados |

---

## Estado atual

### O que está pronto

**Páginas públicas**

- Home, com apresentação do produto
- Explorar startups, com busca, filtros por área, serviço, tecnologia, segmento e localização, ordenação e estados de carregamento e vazio
- Para empresas e Para startups, com conteúdo e perguntas frequentes
- Perfil público da startup, com avatar, área, localização, site, descrição e tags

**Contas**

- Cadastro de startup, integrado ao backend
- Cadastro de empresa, integrado ao backend
- Login com escolha do tipo de conta e validação do tipo devolvido
- Logout de ponta a ponta
- Rotas privadas validadas por sessão antes de renderizar

**Dashboard da startup**

- Saúde do perfil, com percentual calculado pelos campos preenchidos e lista de próximos passos indicando o que falta e como preencher
- Oportunidades recomendadas
- Conexões, com os estados de interesse enviado, match e recusado
- Notificações, derivadas das conexões
- Meu perfil, em modo leitura
- Planos, com comparação entre gratuito e premium

**Dashboard da empresa**

- Painéis de demandas, recomendações e conexões
- Modais de nova demanda e de perfil da startup
- Cálculo de compatibilidade que cruza as demandas com o catálogo de startups por serviços, tecnologias e segmentos

**Qualidade**

- Build de tipos limpo, linter sem avisos
- 50 testes automatizados cobrindo componentes, contexto de autenticação e bibliotecas de domínio

### O que ainda não existe

Esta seção é tão importante quanto a anterior. Partes das telas foram construídas antes da API correspondente, com dados de exemplo sinalizados na própria interface.

**No backend**

- Nenhuma rota de alteração. Não há `PUT`, `PATCH` nem `DELETE`, então uma conta criada não consegue editar os próprios dados
- Nenhuma forma de remover uma tag associada por engano
- Tabelas de catálogo (`segment`, `service`, `expertise`, `technology`) criadas vazias, sem dados iniciais
- Rotas de listagem apenas para segmentos. Serviço, área de atuação e tecnologia não têm
- Nenhuma tabela de demanda da empresa
- Nenhuma tabela de conexão, interesse ou contratação
- Consentimento LGPD com tabelas e função de consulta no banco, mas sem rota exposta
- Nenhum registro de visualização de perfil, aparição em busca ou clique
- Nenhum campo de plano de assinatura

**No frontend, por consequência**

- As oportunidades da startup e as demandas da empresa usam dados de exemplo
- O cálculo de compatibilidade roda sobre esses dados de exemplo
- A edição do perfil está desabilitada, com a razão escrita na interface
- A contratação do plano premium está desabilitada, pelo mesmo motivo
- Os campos `relevance`, `remote` e `onsite`, usados na ordenação e nos filtros, não existem na API e estão fixos no cliente

---

## Decisões de produto

**Dados fictícios não aparecem em páginas públicas.** Enquanto o catálogo não tiver startups reais, a vitrine fica na área logada. Mostrar empresas inventadas na página inicial de uma plataforma que se apresenta como real passa a impressão errada.

**Métrica sobre o próprio perfil não é simulada.** Empresa de exemplo numa lista é claramente um espaço reservado. "128 visualizações do seu perfil" seria lido como fato sobre a pessoa, então o painel de visibilidade mostra zero com a explicação de que a medição ainda não existe.

**Botão que não funciona fica desabilitado, com a razão escrita.** Vale para a edição de perfil e para a assinatura do premium. Botão que parece funcionar e não faz nada custa mais confiança do que um botão ausente.

**Dados de contato não vão para o perfil público.** O backend devolve e-mail e CNPJ da startup, mas nenhum dos dois é exibido. O e-mail é o de cadastro, e reaproveitá-lo como contato público é exatamente o tipo de uso que a LGPD cobra. Se o perfil precisar de contato, deve ser um campo que a startup escolha preencher.

**Necessidades das empresas não são expostas publicamente.** A descrição da demanda circula apenas dentro da área autenticada.

---

## Privacidade e LGPD

A plataforma trata dados pessoais e de empresas, e as medidas previstas são:

- Registro explícito de consentimento no cadastro, com data e versão dos termos
- Exportação dos dados do titular
- Exclusão de conta com remoção ou anonimização
- Senhas armazenadas apenas como hash, com Argon2id
- Coleta mínima, pedindo só o que o produto realmente usa

**Situação real:** o banco já tem as tabelas `startup_lgpd_consent` e `company_lgpd_consent`, com controle de versão da política, e o backend tem função para consultar o consentimento. Porém **nenhuma rota está exposta e nenhuma tela pede o consentimento**, e a coluna tem padrão `revoked`. Na prática, nenhuma conta cadastrada hoje tem consentimento registrado. É a pendência de maior risco do projeto e está rastreada.

---

## Arquitetura

### Fluxo de uma requisição

```
Cliente (React)
  -> JSON sobre HTTP, com cookie de sessão
  -> Wisp: middlewares de CORS, sessão e validação do corpo
  -> Handler da rota
  -> Módulo de domínio (startup, company, lgpd)
  -> Consulta SQL tipada pelo Squirrel
  -> PostgreSQL
```

### Carregamento progressivo

As tags de uma startup vêm de quatro rotas separadas. O backend manteve um endpoint por tabela de propósito: numa resposta única, uma consulta que falhasse derrubaria o card inteiro.

O frontend acompanha esse desenho. As telas renderizam com os dados básicos e completam cada item quando as tags dele chegam, em vez de segurar a página esperando todas as respostas. Cada recurso que falhar vira lista vazia, sem afetar os outros.

---

## Contribuindo

### Branches

```
main              # código estável
develop           # integração do time
feat/<nome>       # nova funcionalidade
fix/<nome>        # correção
refactor/<nome>   # refatoração
docs/<nome>       # documentação
```

O padrão de nome inclui o autor, por exemplo `feat/bianca-dashboard-startup`.

### Pull requests

Toda alteração em `develop` passa por PR com ao menos uma revisão de outro membro do time. Antes de abrir, vale rodar:

```bash
cd frontend
npm run build && npm run test && npm run lint
```

---

## Equipe

| Nome | Responsabilidade |
| --- | --- |
| [Bianca Guimarães](https://github.com/BiancagscCabral) | Desenvolvedora Front-end · Pesquisa e Melhoria Contínua |
| [Eduardo Soares](https://github.com/edudxs) | Documentação Técnica · Gestão de Projeto (Trello, Docs e Apresentações) |
| [Gislany Araujo](https://github.com/gislanysa) | Desenvolvedora Front-end · Owner do Repositório |
| [João Marcos](https://github.com/jmtmds) | Desenvolvedor Front-end · Documentação Técnica |
| [Pedro Ayres](https://tangled.org/kacaii.dev) | Desenvolvedor Back-end |
| [Reideclildon Paulo](https://github.com/kiing12) | Desenvolvedor Back-end |

### Contribuições por frente

**Frontend**

- **Bianca Guimarães:** página inicial, identidade visual e sistema de cores, componentes compartilhados, Explorar startups, perfil público da startup, dashboard da startup com saúde do perfil, conexões, notificações e planos, adaptação do cliente HTTP ao contrato do backend
- **Gislany Araujo:** dashboard da empresa com demandas, recomendações e conexões, layout compartilhado entre os dois dashboards, contexto de autenticação, correção do login e do cadastro de empresa, configuração de testes automatizados
- **João Marcos:** Explorar startups com painel de filtros e cartão de startup, página Para startups, formulários de cadastro

**Backend**

- **Pedro Ayres:** servidor em Gleam, modelagem do banco, autenticação por cookie de sessão, módulos de startup, empresa e LGPD, rotas de catálogo e de associação de tags, testes do servidor
- **Reideclildon Paulo:** backend

**Documentação e gestão**

- **Eduardo Soares:** documentação técnica, gestão do projeto no Trello, apresentações

---

## Licença

Distribuído sob a licença MIT. Ver [LICENSE](LICENSE).

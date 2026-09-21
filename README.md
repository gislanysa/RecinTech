# RecInTech

- **Disciplina:** `Projeto Integrador Multidisciplinar`
- **Instituição:** `Faculdade Senac de Pernambuco`
- **Período:** `2026.2`

## O que é o projeto

RecInTech — **Rec**ife + **In**terconexão + **Tech** — é uma plataforma que conecta
startups do Porto Digital (Recife/PE) a empresas que precisam de soluções.

O produto resolve duas dores ao mesmo tempo: a dificuldade das startups de ganharem
visibilidade e serem encontradas, e a dificuldade das empresas de encontrarem
fornecedores adequados à sua necessidade.

O produto é entregue como SaaS.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Axios.
- **Backend:** Gleam, BEAM VM, árvore de supervisão OTP.
- **Database:** PostgreSQL 16.
- **Orquestração:** Docker Compose.

### Atores

| Ator | O que pode fazer |
| --- | --- |
| Startup cadastrada | Cria perfil com serviços, tecnologias, especialidades, portfólio e segmentos; fica disponível para busca e para recomendação |
| Empresa cadastrada | Pesquisa startups, cadastra demandas e recebe recomendações personalizadas |
| Visitante sem cadastro | Pesquisa e visualiza perfis de startups; não participa do matchmaking |

### O que o MVP faz

- Cadastro e autenticação de usuários (startup e empresa)
- Perfil público de startup com nome e descrição, área de atuação, serviços e soluções
  oferecidos, tecnologias utilizadas, especialidades e competências, portfólio de
  projetos realizados, segmentos de mercado atendidos e informações de contato
- Catálogo e busca pública, sem necessidade de login, com filtros por área de atuação,
  serviço, tecnologia e segmento de mercado
- Cadastro de demandas pela empresa (campos estruturados + descrição em texto livre)
- Recomendação de startups compatíveis com a demanda, ordenada por score e com os
  motivos da compatibilidade
- Registro de interesse entre empresa e startup, com status (`pendente`, `aceito`, `recusado`)
- Exportação de dados pessoais e registro de consentimento (LGPD)

### Como funciona o matching

A empresa descreve o que precisa — por exemplo: *"Precisamos desenvolver um aplicativo
para gerenciamento de pedidos e buscamos uma startup especializada em desenvolvimento
mobile."*

O sistema calcula um **score de compatibilidade** entre a demanda e cada perfil de
startup, considerando:

- sobreposição de serviços oferecidos, tecnologias, área de atuação, segmento e especialidades;
- correspondência do texto livre da demanda com a descrição e o portfólio da startup,
  via full-text search do PostgreSQL.

O resultado é uma lista das startups mais compatíveis, acompanhada dos motivos do match
(ex.: *"compatível em: desenvolvimento mobile, React Native, varejo"*).

> O matching da v1 é **recomendação por compatibilidade**, calculada em SQL — não é
> machine learning. Refinamento de pesos e aprendizado por feedback ficam para a Entrega 2.

### O que o MVP não faz

- Não há chat interno, notificação por e-mail ou upload de documentos.
- Não há perfis de mentor ou investidor anjo.
- Não há modelo de machine learning por trás da recomendação.

---

**Frontend**

| Camada | Tecnologia |
| --- | --- |
| Biblioteca de UI | React 18 |
| Build / dev server | Vite |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS |
| Cliente HTTP | Axios |

**Backend**

| Camada | Tecnologia |
| --- | --- |
| Linguagem | Gleam |
| Runtime | BEAM VM (Erlang), com árvore de supervisão OTP |
| Servidor HTTP | Mist |
| Framework web | Wisp |
| Acesso a dados | pog (cliente PostgreSQL) + Squirrel (SQL type-safe) |
| Hash de senha | argus (Argon2id) |
| Tokens | JWT via implementação JOSE |
| Banco | PostgreSQL 16 |

Gleam é uma linguagem funcional de tipagem estática que compila para Erlang e roda na
BEAM. A escolha traz tipagem forte de ponta a ponta (front em TypeScript, back em Gleam)
e o modelo de concorrência do BEAM. Em contrapartida, o ecossistema é jovem: não há ORM,
então o acesso a dados é SQL escrito à mão e tipado pelo Squirrel.

**Infraestrutura**

- Docker e Docker Compose para orquestração local
- Volume Docker para persistência do Postgres

---

## Arquitetura
Em construção.


### Fluxo de uma requisição

```
Cliente (React)
  → HTTPS / JSON
  → Middlewares (CORS, auth, rate limit, validação)
  → Controller
  → Service (regras de negócio)
  → Repository
  → PostgreSQL
```

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose
- Git

### Passos

```bash
git clone https://github.com/gislanysa/startai.git
cd startai
cp .env.example .env
docker compose up -d
```

Serviços disponíveis após subir:

| Serviço | URL |
| --- | --- |
| Front-end | http://localhost: |
| API | http://localhost: |
| PostgreSQL | localhost: |

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do container do banco |
| `PORT` | Porta da API (padrão `8080`) |
| `JWT_SECRET` | Segredo de assinatura do access token |
| `JWT_REFRESH_SECRET` | Segredo de assinatura do refresh token |
| `WISP_SECRET_KEY_BASE` | Chave usada pelo Wisp para assinar cookies |
| `CORS_ORIGIN` | Origem permitida do front-end |

---

## API

Endpoints previstos para o MVP:

### Autenticação

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/auth/signup` | 201 |
| POST | `/auth/login` | 200 |
| POST | `/auth/refresh` | 200 / 401 |
| POST | `/auth/logout` | 204 |

O `signup` recebe o papel do usuário (`startup` ou `empresa`).

### Usuários

| Método | Rota | Retorno |
| --- | --- | --- |
| GET | `/users/me` | 200 |
| PUT | `/users/me` | 200 |
| DELETE | `/users/me` | 204 |

### Startups — leitura pública

| Método | Rota | Retorno |
| --- | --- | --- |
| GET | `/startups` | 200 |
| GET | `/startups/:id` | 200 / 404 |
| GET | `/search?area=&servico=&tecnologia=&segmento=` | 200 |

### Startups — escrita (autenticado, role `startup`)

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/startups` | 201 |
| PUT | `/startups/:id` | 200 |
| DELETE | `/startups/:id` | 204 |

### Empresas (autenticado, role `empresa`)

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/companies` | 201 |
| GET | `/companies/:id` | 200 / 404 |
| PUT | `/companies/:id` | 200 |

### Demandas e matching (autenticado, role `empresa`)

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/demands` | 201 |
| GET | `/demands` | 200 |
| GET | `/demands/:id` | 200 / 404 |
| PATCH | `/demands/:id` | 200 |
| DELETE | `/demands/:id` | 204 |
| GET | `/demands/:id/matches` | 200 |

### Interesse

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/interests` | 201 |
| GET | `/interests` | 200 |
| PATCH | `/interests/:id` | 200 |

### LGPD

| Método | Rota | Retorno |
| --- | --- | --- |
| POST | `/privacy/consent` | 201 |
| GET | `/users/me/export` | 200 |

### Códigos de status utilizados

`200` OK · `201` Created · `204` No Content · `400` Bad Request · `401` Unauthorized
`403` Forbidden · `404` Not Found · `409` Conflict · `422` Unprocessable
`429` Too Many Requests · `500` Server Error

Autenticação via header `Authorization: Bearer <token>`. As rotas de catálogo e busca
(`GET /startups`, `GET /startups/:id`, `GET /search`) são públicas e dispensam token.

---

## Privacidade e LGPD

A plataforma trata dados pessoais de fundadores de startups e de representantes de
empresas. As medidas previstas desde o início do desenvolvimento:

- Registro explícito de consentimento no cadastro, com data e versão dos termos
- Endpoint de exportação dos dados do titular (`GET /users/me/export`)
- Exclusão de conta com remoção ou anonimização dos dados (`DELETE /users/me`)
- Senhas armazenadas apenas como hash, nunca em texto puro
- Coleta mínima: só pedimos o que o produto realmente usa

Conformidade não é tarefa da última sprint — cada funcionalidade que toca dado pessoal
já nasce com esses pontos considerados.

---

## Roadmap

| Entrega | Escopo | Prazo |
| --- | --- | --- |
| Entrega 1 — MVP | Auth, perfis, busca pública, demandas, matching por score, LGPD básico | 15/10/2026 |
| Entrega 2 — SaaS | Backlog completo (ver Trello) | 11/12/2026 |

---

## Contribuindo

### Branches

```
main            # código estável
develop         # integração
feat/<nome>     # nova funcionalidade
fix/<nome>      # correção
docs/<nome>     # documentação
```

### Pull requests

Toda alteração em `develop` passa por PR com pelo menos uma revisão de outro membro do time.

---

## Equipe

| Nome | Responsabilidade |
| --- | --- |
| [Bianca Guimarães](https://github.com/BiancagscCabral) | Desenvolvedora Front-end · Pesquisa e Melhoria Contínua |
| [Eduardo Soares](https://github.com/edudxs) | Documentação Técnica · Gestão de Projeto (Trello, Docs & Apresentações) |
| [Gislany Araujo](https://github.com/gislanysa) | Desenvolvedora Front-end · Owner do Repositório |
| [João Marcos](https://github.com/jmtmds) | Desenvolvedor Front-end · Documentação Técnica |
| [Pedro Ayres](https://tangled.org/kacaii.dev) | Desenvolvedor Back-end |
| [Reideclildon Paulo](https://github.com/kiing12) | Desenvolvedor Back-end |


---

## Licença

Distribuído sob a licença MIT. Ver [LICENSE](LICENSE).

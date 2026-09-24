openapi: 3.0.4
info:
  title: SENAC Matchmaker API
  description: >
    API do backend em Gleam da plataforma matchmaker que conecta
    startups com tração a investidores.
  version: 0.1.0

servers:
  - url: http://localhost:8000
    description: Servidor de desenvolvimento local

paths:
  /api/healthcheck:
    get:
      summary: Verifica se o servidor está no ar.
      operationId: healthcheck
      tags: [health]
      responses:
        "200":
          description: Servidor operando normalmente.

  /:
    get:
      summary: Retorna o documento HTML raiz da aplicação cliente.
      operationId: getRootDocument
      tags: [client]
      responses:
        "200":
          description: HTML da SPA.
          content:
            text/html:
              schema:
                type: string

  /api/user/{id}:
    get:
      summary: Busca um usuário pelo id.
      operationId: getUserById
      tags: [user]
      parameters:
        - $ref: "#/components/parameters/UuidId"
      responses:
        "200":
          description: Usuário encontrado.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          description: Email ou senha incorretos.
          content:
            text/plain:
              schema:
                type: string
                example: "Wrong email or password"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          description: Email já está em uso.
          content:
            text/plain:
              schema:
                type: string
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"

  /api/startup/{id}:
    get:
      summary: Busca uma startup pelo id.
      operationId: getStartupById
      tags: [startup]
      parameters:
        - $ref: "#/components/parameters/UuidId"
      responses:
        "200":
          description: Startup encontrada.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Startup"
        "400":
          $ref: "#/components/responses/BadRequest"
        "404":
          $ref: "#/components/responses/NotFound"
        "409":
          description: "Conflito (ex: CNPJ já em uso, membro/segmento já atribuído)."
          content:
            text/plain:
              schema:
                type: string
        "500":
          $ref: "#/components/responses/InternalServerError"
        "503":
          $ref: "#/components/responses/ServiceUnavailable"

components:
  parameters:
    UuidId:
      name: id
      in: path
      required: true
      description: Identificador do recurso, em formato UUID.
      schema:
        type: string
        format: uuid
      example: "01a058ae-057f-73e8-b2a0-50986559767b"

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        full_name:
          type: string
        email:
          type: string
          format: email
        created_at:
          type: string
          format: date-time
        is_active:
          type: boolean
      required: [id, full_name, email, created_at, is_active]
      example:
        id: "01a058ae-057f-73e8-b2a0-50986559767b"
        full_name: "Marquinhos"
        email: "user@email.com"
        created_at: "2026-09-14T20:08:02.000Z"
        is_active: true

    Startup:
      type: object
      properties:
        id:
          type: string
          format: uuid
        segment_id:
          type: string
          format: uuid
        name:
          type: string
        cnpj:
          type: string
        description:
          type: string
        city:
          type: string
        state:
          type: string
        created_at:
          type: string
          format: date-time
      required: [id, segment_id, name, cnpj, description, city, state, created_at]
      example:
        id: "01a058ae-057f-73e8-b2a0-50986559767b"
        segment_id: "01a058ae-057c-717a-ad81-f36b3be5c737"
        name: "Critic Level"
        cnpj: "12345678901234"
        description: "startup muito maneira"
        city: "Recife"
        state: "Pernambuco"
        created_at: "2026-09-14T20:08:02.000Z"

  responses:
    BadRequest:
      description: "Requisição inválida (ex: id fora do formato UUID)."
      content:
        text/plain:
          schema:
            type: string
    NotFound:
      description: Recurso não encontrado.
      content:
        text/plain:
          schema:
            type: string
    InternalServerError:
      description: Erro interno do servidor.
    ServiceUnavailable:
      description: Banco de dados indisponível ou timeout na consulta.

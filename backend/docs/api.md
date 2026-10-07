# HTTP Endpoints

## GET /api/healthcheck

Check if the HTTP server is running correctly.

### Status Codes

- 200: OK

### Response Body

```json
OK
```

## GET /

Serve the client-side application.

### Status Codes

- 200: OK (HTML)

## POST /api/auth/login

Authenticate a user. Sets a session cookie if successful (valid for 1 hour).

### Request Body

```json
{
  "session": "startup",
  "email": "wibble@email.com",
  "password": "12345678"
}
```

```json
{
  "session": "investor",
  "email": "investor@email.com",
  "password": "12345678"
}
```

### Response Body

Startup session:

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "seed",
  "cnpj": "12345678901234",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "criticlevel.dev"
}
```

Investor session:

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Porto Digital",
  "kind": "angel",
  "public_profile": true,
  "email": "investor@email.com",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true
}
```

### Status Codes

- 200: Successful authentication
- 400: Invalid JSON format or invalid session type or invalid email format
- 401: Incorrect email or password

## GET /api/auth/restore

Restore an active user session. Requires a valid session cookie.

### Response Body

Startup:

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "seed",
  "cnpj": "12345678901234",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "criticlevel.dev"
}
```

Investor:

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Investor Name",
  "kind": "angel",
  "public_profile": true,
  "email": "investor@email.com",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true
}
```

### Status Codes

- 200: Successful
- 401: Missing session cookie
- 404: User not found

## GET /api/auth/refresh

Refresh the current session token duration. On success, a new session cookie
is set (valid for 1 hour).

### Status Codes

- 200: Successful
- 401: Missing session cookie

## POST /api/startup

Register a new startup.

### Request Body

```json
{
  "name": "Recintech",
  "email": "recintech@email.com",
  "password": "12345678",
  "cnpj": "12345678901234",
  "stage": "seed",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "website": "recintech.dev"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "seed",
  "cnpj": "12345678901234",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "criticlevel.dev"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid data
- 409: Duplicated email or CNPJ

## GET /api/startup

Fetch a list of registered startups.

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Critic Level",
    "email": "wibble@email.com",
    "stage": "seed",
    "cnpj": "12345678901234",
    "description": "startup muito maneira",
    "city": "Recife",
    "state": "Pernambuco",
    "created_at": "2026-09-14T20:08:02.000Z",
    "is_active": true,
    "website": "wibble.com"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Virada no Cafe",
    "email": "wobble@email.com",
    "stage": "growth",
    "cnpj": "12345678901234",
    "description": "bem legal",
    "city": "Recife",
    "state": "Pernambuco",
    "created_at": "2025-09-14T20:08:02.000Z",
    "is_active": true,
    "website": "wobble.com"
  }
]
```

### Status Codes

- 200: Successful
- 400: Missing, invalid or incomplete query parameters

## GET /api/startup/:id

Fetch information about a startup.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "seed",
  "cnpj": "12345678901234",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "criticlevel.dev"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Startup not found

## GET /api/startup/:id/segment

Fetch all segments that a startup is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Tech",
    "description": ""
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Biotech",
    "description": ""
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Startup not found

## GET /api/startup/:id/service

Fetch all services that a startup is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "UI/UX",
    "description": "user experience"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Web development",
    "description": "Websites and http servers"
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Startup not found

## GET /api/startup/:id/expertise

Fetch all expertises that a startup is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Education",
    "description": ""
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Health",
    "description": "Medical stuff"
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Startup not found

## GET /api/startup/:id/technology

Fetch all technologies that a startup is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Javascript",
    "description": "dont"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Python",
    "description": "Please dont"
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Startup not found

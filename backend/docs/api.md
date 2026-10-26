# API

## GET /api/healthcheck

Check if the HTTP server is running correctly.

### Response Body

Empty.

### Status Codes

- 200: Successful

## GET /

Serve the HTML document for the client-side application. Any unknown
non-API route falls back to this document.

### Response Body

The application's HTML document.

### Status Codes

- 200: Successful

## POST /api/auth/login

Authenticate a startup or a company. On success, a signed `SESSION` cookie is
set on the response, lasting exactly one hour. The response body contains
startup or company data, depending on the session type.

### Request Body

```json
{
  "session": "startup",
  "email": "wibble@email.com",
  "password": "12345678"
}
```

- `session`: either `"startup"` or `"company"`

### Response Body

The startup or company object for the authenticated account, e.g.:

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "traction",
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
- 400: Invalid JSON, invalid email format or invalid session type
- 401: Wrong email or password

## POST /api/auth/logout

Deletes the session cookie stored in the user request.

### Status Codes

- 204: Successful
- 401: Missing cookie

## GET /api/auth/restore

Check for an active session token and restore it. On success, the server
sends startup or company data, depending on the session type. This route does
**not** refresh the session token duration.

Requires the `SESSION` cookie.

### Response Body

The startup or company object for the active session.

### Status Codes

- 200: Successful
- 401: Missing session cookie
- 404: Startup or Company not found

## GET /api/auth/refresh

Refresh the duration of the current session token.

Requires the `SESSION` cookie.

### Status Codes

- 204: Successful
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
  "stage": "traction",
  "description": "startup muito maneira",
  "city": "Recife",
  "state": "Pernambuco",
  "website": "recintech.dev"
}
```

- `stage`: either `"traction"` or `"scaling"`

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Critic Level",
  "email": "critic@email.dev",
  "stage": "traction",
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

## GET /api/segment

Fetch a list of registered segments.

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
   "name": "Tech",
   "description": "Technology"
  },
  {
   "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
   "name": "Biotech",
   "description": "Technology, but Bio"
  }
]
```

### Status Codes

- 200: Successful
- 400: Missing, invalid or incomplete query parameters

## GET /api/technology

Fetch a list of registered technologies.

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Gleam",
    "description": "A friendly language for building type-safe systems"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "PostgreSQL",
    "description": "The world's most advanced open source database"
  }
]
```

### Status Codes

- 200: Successful
- 400: Missing, invalid or incomplete query parameters

## GET /api/technology/:id

Fetch information about a technology.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Gleam",
  "description": "A friendly language for building type-safe systems"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Technology not found

## GET /api/expertise

Fetch a list of registered expertises.

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Education",
    "description": "Teaching and learning"
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
- 400: Missing, invalid or incomplete query parameters

## GET /api/expertise/:id

Fetch information about an expertise.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Education",
  "description": "Teaching and learning"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Expertise not found

## GET /api/service

Fetch a list of registered services.

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Web development",
    "description": "Websites and http servers"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "UI/UX",
    "description": "user experience"
  }
]
```

### Status Codes

- 200: Successful
- 400: Missing, invalid or incomplete query parameters

## GET /api/service/:id

Fetch information about a service.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Web development",
  "description": "Websites and http servers"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Service not found

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
    "stage": "traction",
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
    "stage": "scaling",
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
  "stage": "traction",
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

## POST /api/startup/:id/segment

Assign a segment to a startup.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "segment": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Tech",
  "description": "Technology-related stuff"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Startup or Segment not found
- 409: Already assigned

## DELETE /api/startup/:id/segment/:segment_id

Unassign a segment from a startup.

### Path Parameters

- `id` (UUID, required)
- `segment_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Tech",
  "description": "Technology-related stuff"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Segment is not assigned to the startup

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

## POST /api/startup/:id/service

Assign a service to a startup.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "service": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "UI/UX",
  "description": "user experience"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Startup or Service not found
- 409: Already assigned

## DELETE /api/startup/:id/service/:service_id

Unassign a service from a startup.

### Path Parameters

- `id` (UUID, required)
- `service_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "UI/UX",
  "description": "user experience"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Service is not assigned to the startup

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

## POST /api/startup/:id/expertise

Assign an expertise to a startup.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "expertise": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Education",
  "description": "May it be free and for everyone"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Startup or Expertise not found
- 409: Already assigned

## DELETE /api/startup/:id/expertise/:expertise_id

Unassign an expertise from a startup.

### Path Parameters

- `id` (UUID, required)
- `expertise_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Education",
  "description": "May it be free and for everyone"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Expertise is not assigned to the startup

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

## POST /api/startup/:id/technology

Assign a technology to a startup.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "technology": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Javascript",
  "description": "dont"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Startup or Technology not found
- 409: Already assigned

## DELETE /api/startup/:id/technology/:technology_id

Unassign a technology from a startup.

### Path Parameters

- `id` (UUID, required)
- `technology_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Javascript",
  "description": "dont"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Technology is not assigned to the startup

## POST /api/company

Register a new company.

### Request Body

```json
{
  "name": "Porto Digital",
  "size": "micro",
  "email": "porto@email.com",
  "password": "12345678",
  "cnpj": "12345678901234",
  "city": "Recife",
  "state": "Pernambuco",
  "website": "https://portodigital.org"
}
```

- `size`: one of `"micro"`, `"small"`, `"medium"` or `"big"`

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Porto Digital",
  "email": "porto@email.com",
  "size": "micro",
  "cnpj": "12345678901234",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "https://portodigital.org"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid data
- 409: Duplicated email or CNPJ

## GET /api/company/:id

Fetch information about a company.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Porto Digital",
  "email": "porto@email.com",
  "size": "micro",
  "cnpj": "12345678901234",
  "city": "Recife",
  "state": "Pernambuco",
  "created_at": "2026-09-14T20:08:02.000Z",
  "is_active": true,
  "website": "https://portodigital.org"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Company not found

## GET /api/company/:id/demand

Fetch all demands assigned to a company.

### Path Parameters

- `id` (UUID, required)

### Query Parameters

- `limit` (int, required)
- `offset` (int, required)

### Response Body

```json
[
  {
    "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
    "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
    "title": "Need more gleam projects",
    "description": "A lot more of them",
    "status": "open",
    "created_at": "2026-09-14T20:08:02.000Z",
    "updated_at": "2026-09-14T20:08:02.000Z"
  }
]
```

- `status`: one of `"open"`, `"closed"` or `"canceled"`

### Status Codes

- 200: Successful
- 400: Invalid UUID, or missing, invalid or incomplete query parameters

## POST /api/company/:id/demand

Register a new demand for a company. Segments, services, expertises and
technologies can be assigned to the demand in the same request.

### Path Parameters

- `id` (UUID, required): the company's ID.

### Request Body

```json
{
  "title": "Need more gleam projects",
  "description": "A lot more of them",
  "status": "open",
  "segments": ["01a058ae-057f-73e8-b2a0-50986559767b"],
  "services": ["01a0dbb3-153a-7b84-8c3d-631788972d4a"],
  "expertises": ["01a173cb-9533-7ebd-87a0-590965ef3653"],
  "technologies": ["01a173cb-9533-7eb5-9522-9686fef4f2a4"]
}
```

- `status`: one of `"open"`, `"closed"` or `"canceled"`
- `segments`, `services`, `expertises` and `technologies`: lists of UUIDs.
  The lists may be empty, but all four fields are required.

### Response Body

```json
{
  "demand": {
    "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
    "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
    "title": "Need more gleam projects",
    "description": "A lot more of them",
    "status": "open",
    "created_at": "2025-09-14T20:08:02.000Z",
    "updated_at": "2025-09-14T20:08:02.000Z"
  },
  "expertises": [
    {
      "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
      "name": "Education",
      "description": "Teaching and learning"
    }
  ],
  "segments": [
    {
      "id": "01a058ae-057f-73e8-b2a0-50986559767b",
      "name": "Tech",
      "description": "Technology"
    }
  ],
  "services": [
    {
      "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
      "name": "Web development",
      "description": "Websites and http servers"
    }
  ],
  "technologies": [
    {
      "id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
      "name": "Gleam",
      "description": "A friendly language for building type-safe systems"
    }
  ]
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Company or assigned entity not found
- 409: An entity is already assigned to the demand

## GET /api/company/demand/:id/segment

Fetch all segments that a company's demand is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Tech",
    "description": "Technology"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "Biotech",
    "description": "Technology, but Bio"
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format

## POST /api/company/demand/:id/segment

Assign a segment to a company's demand.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "segment": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Tech",
  "description": "Technology-related stuff"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Demand or Segment not found
- 409: Already assigned

## DELETE /api/company/demand/:id/segment/:segment_id

Unassign a segment from a company's demand.

### Path Parameters

- `id` (UUID, required)
- `segment_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Tech",
  "description": "Technology-related stuff"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Segment is not assigned to the demand

## GET /api/company/demand/:id/service

Fetch all services that a company's demand is assigned to.

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

## POST /api/company/demand/:id/service

Assign a service to a company's demand.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "service": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "UI/UX",
  "description": "user experience"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Demand or Service not found
- 409: Already assigned

## DELETE /api/company/demand/:id/service/:service_id

Unassign a service from a company's demand.

### Path Parameters

- `id` (UUID, required)
- `service_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "UI/UX",
  "description": "user experience"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Service is not assigned to the demand

## GET /api/company/demand/:id/technology

Fetch all technologies that a company's demand is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Gleam",
    "description": "A friendly language for building type-safe systems"
  },
  {
    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
    "name": "PostgreSQL",
    "description": "The world's most advanced open source database"
  }
]
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format

## POST /api/company/demand/:id/technology

Assign a technology to a company's demand.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "technology": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Gleam",
  "description": "A friendly language for building type-safe systems"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Demand or Technology not found
- 409: Already assigned

## DELETE /api/company/demand/:id/technology/:technology_id

Unassign a technology from a company's demand.

### Path Parameters

- `id` (UUID, required)
- `technology_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Gleam",
  "description": "A friendly language for building type-safe systems"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Technology is not assigned to the demand

## GET /api/company/demand/:id/expertise

Fetch all expertises that a company's demand is assigned to.

### Path Parameters

- `id` (UUID, required)

### Response Body

```json
[
  {
    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
    "name": "Education",
    "description": "Teaching and learning"
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

## POST /api/company/demand/:id/expertise

Assign an expertise to a company's demand.

### Path Parameters

- `id` (UUID, required)

### Request Body

```json
{
  "expertise": "01a058ae-057f-73e8-b2a0-50986559767b"
}
```

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Education",
  "description": "May it be free and for everyone"
}
```

### Status Codes

- 201: Successful
- 400: Invalid JSON or invalid UUID
- 404: Demand or Expertise not found
- 409: Already assigned

## DELETE /api/company/demand/:id/expertise/:expertise_id

Unassign an expertise from a company's demand.

### Path Parameters

- `id` (UUID, required)
- `expertise_id` (UUID, required)

### Response Body

```json
{
  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
  "name": "Education",
  "description": "May it be free and for everyone"
}
```

### Status Codes

- 200: Successful
- 400: Invalid UUID format
- 404: Expertise is not assigned to the demand

//// Http handlers and middlewares

import gleam/dynamic/decode
import gleam/http
import gleam/http/request
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import lustre/attribute
import lustre/element
import lustre/element/html
import pog
import server/cnpj
import server/email
import server/segment
import server/startup
import server/startup/expertise
import server/startup/service
import server/startup/technology
import wisp
import youid/uuid

pub type Context {
  Context(
    /// PostgreSQL connection pool
    database: pog.Connection,
    /// Path to the application's priv directory
    static_directory: String,
  )
}

type WebError {
  /// Startup related errors
  StartupError(startup.StartupError)
  /// Missing request query
  MissingQuery
  /// Invalid query parameter
  InvalidQueryParameter(key: String)
}

/// Handle incoming HTTP requests
///
/// ## Examples
///
/// ```gleam
/// let response = web.handle_request(request, context)
/// assert response.status == 200
/// ```
pub fn handle_request(
  request: wisp.Request,
  context: Context,
) -> wisp.Response {
  use request <- middleware(request, context)

  case request.method, request.path_segments(request) {
    // ## HEALTHCHECK
    // Check if the HTTP server is running correctly.
    http.Get, ["api", "healthcheck"] -> wisp.ok()

    // ## CLIENT
    // Send the HTML to the client.
    http.Get, [] -> get_root_document()

    // +-----------------------------------------------------------------------+
    // | AUTH                                                                  |
    // +-----------------------------------------------------------------------+
    //
    // Authorization / Authentication related routes.
    http.Post, ["api", "auth", "login"] ->
      handle_login(request, context.database)

    // +-----------------------------------------------------------------------+
    // | STARTUP                                                               |
    // +-----------------------------------------------------------------------+
    //
    // Querying, registering and assigning entities to startups.
    //
    http.Get, ["api", "startup"] -> get_many_startups(request, context.database)
    http.Get, ["api", "startup", id] -> get_startup_by_id(context.database, id)

    // Fetching specific information about startups
    //
    http.Get, ["api", "startup", "segment", id] ->
      get_startup_segments(context.database, id)

    http.Get, ["api", "startup", "service", id] ->
      get_startup_services(context.database, id)

    http.Get, ["api", "startup", "expertise", id] ->
      get_startup_expertises(context.database, id)

    http.Get, ["api", "startup", "technology", id] ->
      get_startup_technologies(context.database, id)

    // ## Fallback routes
    _, _ -> wisp.not_found()
  }
}

/// ## `GET /api/startup/expertise/:id`
///
/// Fetch all Expertises that a Startup is assigned to.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Education",
///    "description": "",
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Health",
///    "description": "Medical stuff",
///   },
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Startup is not found.
///
pub fn get_startup_expertises(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get_expertises(database, id) {
    Ok(data) ->
      json.array(data, expertise.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/service/:id`
///
/// Fetch all Services that a Startup is assigned to.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "UI/UX",
///    "description": "user experience"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Web development",
///    "description": "Websites and http servers"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Startup is not found.
///
pub fn get_startup_services(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get_services(database, id) {
    Ok(data) ->
      json.array(data, service.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/segment/:id`
///
/// Fetch all Segments that a Startup is assigned to.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Tech",
///    "description": ""
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Biotech",
///    "description": ""
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Startup is not found.
///
pub fn get_startup_segments(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get_segments(database, id) {
    Ok(data) ->
      json.array(data, segment.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/technology/:id`
///
/// Fetch all Technologies that a Startup is assigned to.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Javascript",
///    "description": "dont",
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Python",
///    "description": "Please dont"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Startup is not found.
///
pub fn get_startup_technologies(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get_technologies(database, id) {
    Ok(data) ->
      json.array(data, technology.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup`
///
/// Fetch a list of registered Startups, pagination is available.
///
/// Required parameters:
/// - limit: `Int`
/// - offset: `Int`
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Critic Level",
///    "stage": "seed",
///    "cnpj": "12345678901234",
///    "description": "startup muito maneira",
///    "city": "Recife",
///    "state": "Pernambuco",
///    "created_at": "2026-09-14T20:08:02.000Z"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Virada no Cafe",
///    "stage": "growth",
///    "cnpj": "12345678901234",
///    "description": "bem legal",
///    "city": "Recife",
///    "state": "Pernambuco",
///    "created_at": "2025-09-14T20:08:02.000Z"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
pub fn get_many_startups(
  request: wisp.Request,
  database: pog.Connection,
) -> wisp.Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter("limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter("offset")),
    )

    startup.get_many(database, limit:, offset:)
    |> result.map_error(StartupError)
  }

  case result {
    Ok(data) ->
      json.array(data, startup.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// Handle WebError
fn handle_error(error: WebError) -> wisp.Response {
  case error {
    StartupError(error) -> handle_startup_error(error)
    MissingQuery -> wisp.bad_request("Missing query")
    InvalidQueryParameter(key:) -> wisp.bad_request("Invalid " <> key)
  }
}

/// Send the necessary HTML for the client-side application. The user will
/// use it to communicate with the Server.
pub fn get_root_document() -> wisp.Response {
  let body =
    html.html([], [
      html.head([], [html.title([], "SENAC")]),
      html.body([], [html.div([attribute.id("app")], [])]),
    ])

  element.to_document_string(body)
  |> wisp.html_body(wisp.ok(), _)
}

fn middleware(
  request: request.Request(wisp.Connection),
  context: Context,
  next: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let request = wisp.method_override(request)
  use <- wisp.log_request(request)
  use <- wisp.rescue_crashes()
  use request <- wisp.handle_head(request)
  use request <- wisp.csrf_known_header_protection(request)
  use <- wisp.serve_static(request, "/static", context.static_directory)

  next(request)
}

/// Return "400 Bad Request" if `id` is not a valid UUID format.
///
/// ## Examples
///
/// ```gleam
/// pub fn handle_request(request, context, id) -> wisp.Response {
///   use id <- require_valid_uuid(id)
///
///   case user.get(database, id) {
///     Ok(data) -> todo as "send response"
///     Error(error) -> todo as "handle error"
///   }
/// }
/// ```
pub fn require_valid_uuid(
  id: String,
  next: fn(uuid.Uuid) -> wisp.Response,
) -> wisp.Response {
  case uuid.from_string(id) {
    Ok(uuid) -> next(uuid)
    Error(_) -> wisp.bad_request("Invalid UUID: " <> id)
  }
}

/// ## `GET /api/startup/:id`
///
/// Fetch information about a Startup.
///
/// ## Response Body
///
/// ```json
/// {
///  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///  "name": "Critic Level",
///  "cnpj": "12345678901234",
///  "description": "startup muito maneira",
///  "city": "Recife",
///  "state": "Pernambuco",
///  "created_at": "2026-09-14T20:08:02.000Z"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 404 If Startup is not found.
///
pub fn get_startup_by_id(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get(database, id) {
    Ok(data) ->
      startup.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// Handle startup.StartupError errors
fn handle_startup_error(error: startup.StartupError) -> wisp.Response {
  case error {
    startup.DatabaseError(error) -> handle_database_error(error)
    startup.FailedToRegisterStartup -> wisp.internal_server_error()

    startup.InvalidStage(error) ->
      { "Invalid stage: " <> error }
      |> wisp.bad_request

    startup.CnpjConflict(cnpj) ->
      { "CNPJ " <> cnpj.to_string(cnpj) <> " is already in use" }
      |> wisp.string_body(wisp.response(409), _)

    startup.NotFound(id) ->
      { "Startup " <> uuid.to_string(id) <> " not found" }
      |> wisp.string_body(wisp.not_found(), _)

    startup.InvalidCnpj(value) ->
      wisp.bad_request("Invalid CNPJ format: " <> value)

    startup.InvalidEmail(value:) -> {
      { "Invalid Email address: " <> value }
      |> wisp.bad_request
    }

    startup.AssignmentFailure(id:) ->
      { "Failed to assign " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.internal_server_error(), _)

    startup.AssignmentConflict(id:) ->
      { uuid.to_string(id) <> " is already assigned" }
      |> wisp.string_body(wisp.response(409), _)

    startup.AssignedMissingEntity(id:) ->
      { "Entity " <> uuid.to_string(id) <> " was not found" }
      |> wisp.string_body(wisp.not_found(), _)

    startup.HashError(_) -> wisp.internal_server_error()

    startup.EmailNotFound(..) | startup.WrongPassword ->
      { "Invalid email or password" }
      |> wisp.string_body(wisp.response(401), _)

    startup.EmailConflict(value:) ->
      { "Email already registered: " <> email.to_string(value) }
      |> wisp.string_body(wisp.response(409), _)
  }
}

/// Handle pog.QueryError errors
fn handle_database_error(error: pog.QueryError) -> wisp.Response {
  case error {
    pog.QueryTimeout | pog.ConnectionUnavailable -> wisp.response(503)

    pog.ConstraintViolated(..)
    | pog.PostgresqlError(..)
    | pog.UnexpectedArgumentCount(..)
    | pog.UnexpectedArgumentType(..)
    | pog.UnexpectedResultType(..) -> wisp.internal_server_error()
  }
}

/// Cookie storing the user session.
pub const session_cookie = "SESSION"

type Login {
  Login(email: email.Email, password: String)
}

fn login_decoder() -> decode.Decoder(Login) {
  use email <- decode.field("email", email.decoder())
  use password <- decode.field("password", decode.string)
  decode.success(Login(email:, password:))
}

/// ## `POST /api/auth/login`
///
/// Sets a session cookie if successful, it will last exactly one hour.
///
/// ## Request Body
///
/// ```json
/// {
///   "email": "wibble@email.com",
///   "password": "12345678"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///  "full_name": "Marquinhos",
///  "email": "user@email.com",
///  "created_at": "2026-09-14T20:08:02.000Z",
///  "is_active": true
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 401 If email or password is incorrect.
/// - 400 If email is not a valid format.
///
pub fn handle_login(
  request: wisp.Request,
  database: pog.Connection,
) -> wisp.Response {
  use body <- wisp.require_json(request)

  case decode.run(body, login_decoder()) {
    Error(_) -> wisp.bad_request("Invalid JSON format")
    Ok(login) ->
      case
        startup.verify(database, email: login.email, password: login.password)
      {
        Error(error) -> handle_startup_error(error)
        Ok(startup) -> {
          let response =
            startup.to_json(startup)
            |> json.to_string()
            |> wisp.json_response(200)

          wisp.set_cookie(
            response:,
            request:,
            name: session_cookie,
            value: uuid.to_string(startup.id),
            security: wisp.Signed,
            // Session will last exactly one hour
            max_age: 60 * 60,
          )
        }
      }
  }
}

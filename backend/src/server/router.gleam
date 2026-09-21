import gleam/http
import gleam/http/request
import gleam/http/response
import gleam/json
import lustre/attribute
import lustre/element
import lustre/element/html
import pog
import server/context
import server/startup
import server/user
import wisp
import youid/uuid

pub fn handle_request(
  request: wisp.Request,
  context: context.Context,
) -> response.Response(wisp.Body) {
  use request <- middleware(request, context)
  case request.method, request.path_segments(request) {
    http.Get, [] -> get_root_document()

    // healthcheck
    http.Get, ["api", "healthcheck"] -> wisp.ok()
    http.Get, ["api", "startup", id] -> get_startup_by_id(context.database, id)
    http.Get, ["api", "user", id] -> get_user_by_id(context.database, id)

    // fallback
    _, _ -> wisp.not_found()
  }
}

/// Send the necessary HTMl for the client-side application.
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
  req: request.Request(wisp.Connection),
  context: context.Context,
  next: fn(wisp.Request) -> wisp.Response,
) -> response.Response(wisp.Body) {
  let request = wisp.method_override(req)
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
///     Error(err) -> todo as "handle error"
///   }
/// }
/// ```
pub fn require_valid_uuid(
  id: String,
  next: fn(uuid.Uuid) -> wisp.Response,
) -> wisp.Response {
  case uuid.from_string(id) {
    Ok(uuid) -> next(uuid)
    Error(_) -> wisp.bad_request("Invalid UUID")
  }
}

/// GET /api/user/:id
///
/// ## Response
///
/// 200 OK
///
/// ```json
/// {
///  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///  "full_name": "Marquinhos",
///  "email": "user@email.com",
///  "created_at": 1788194194.803331,
///  "is_active": true
/// }
/// ```
pub fn get_user_by_id(database: pog.Connection, id: String) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case user.get(database, id) {
    Ok(data) ->
      user.to_json(data)
      |> json.to_string
      |> wisp.json_body(wisp.ok(), _)

    Error(err) -> handle_user_error(err)
  }
}

/// GET /api/startup/:id
///
/// ## Response
///
/// 200 OK
///
/// ```json
/// {
///  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///  "segment_id": "01a058ae-057c-717a-ad81-f36b3be5c737",
///  "name": "Critic Level",
///  "cnpj": "12345678901234",
///  "description": "startup muito maneira",
///  "city": "Recife",
///  "state": "Pernambuco",
///  "created_at": 1788194194.803331
/// }
/// ```
pub fn get_startup_by_id(
  database: pog.Connection,
  id: String,
) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case startup.get(database, id) {
    Ok(data) ->
      startup.to_json(data)
      |> json.to_string
      |> wisp.json_body(wisp.ok(), _)

    Error(err) -> handle_startup_error(err)
  }
}

fn handle_startup_error(error: startup.StartupError) -> wisp.Response {
  case error {
    startup.CnpjConflict -> wisp.response(409)
    startup.DatabaseError(error) -> handle_database_error(error)
    startup.FailedToRegisterStartup -> wisp.internal_server_error()
    startup.InvalidCnpjFormat -> wisp.bad_request("Invalid CNPJ format")
    startup.NotFound -> wisp.not_found()
  }
}

fn handle_user_error(error: user.UserError) -> wisp.Response {
  case error {
    user.DatabaseError(error) -> handle_database_error(error)
    user.EmailConflict -> wisp.response(409)
    user.FailedToRegisterUser -> wisp.internal_server_error()
    user.HashError(_) -> wisp.internal_server_error()
    user.InvalidEmailFormat -> wisp.bad_request("Invalid email format")
    user.NotFound -> wisp.not_found()
    user.WrongPassword -> wisp.response(401)
  }
}

fn handle_database_error(error: pog.QueryError) -> wisp.Response {
  case error {
    pog.ConstraintViolated(message:, ..) -> wisp.bad_request(message)
    pog.QueryTimeout | pog.ConnectionUnavailable -> wisp.response(503)

    pog.PostgresqlError(..)
    | pog.UnexpectedArgumentCount(..)
    | pog.UnexpectedArgumentType(..)
    | pog.UnexpectedResultType(..) -> wisp.internal_server_error()
  }
}

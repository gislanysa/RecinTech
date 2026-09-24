//// Http handlers and middlewares

import gleam/dynamic/decode
import gleam/http
import gleam/http/request
import gleam/json
import lustre/attribute
import lustre/element
import lustre/element/html
import pog
import server/cnpj
import server/email
import server/startup
import server/user
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

/// Handle incoming HTTP requests
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(request) = request.to("http://localhost/api/users")
/// let response = web.handle_request(request, context)
///
/// assert response.status == 200
/// ```
pub fn handle_request(
  request: wisp.Request,
  context: Context,
) -> wisp.Response {
  use request <- middleware(request, context)

  case request.method, request.path_segments(request) {
    // healthcheck
    http.Get, ["api", "healthcheck"] -> wisp.ok()

    // Client
    http.Get, [] -> get_root_document()

    // API
    http.Post, ["api", "auth", "login"] -> handle_login(request, context)
    http.Get, ["api", "startup", id] -> get_startup_by_id(context.database, id)
    http.Get, ["api", "user", id] -> get_user_by_id(context.database, id)

    // fallback
    _, _ -> wisp.not_found()
  }
}

/// Send the necessary HTML for the client-side application.
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
    Error(_) -> wisp.bad_request("Invalid UUID")
  }
}

/// **GET /api/user/:id**
///
/// 200 OK
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
pub fn get_user_by_id(database: pog.Connection, id: String) -> wisp.Response {
  use id <- require_valid_uuid(id)

  case user.get(database, id) {
    Ok(data) ->
      user.to_json(data)
      |> json.to_string
      |> wisp.json_body(wisp.ok(), _)

    Error(error) -> handle_user_error(error)
  }
}

/// **GET /api/startup/:id**
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
///  "created_at": "2026-09-14T20:08:02.000Z"
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

    Error(error) -> handle_startup_error(error)
  }
}

/// Handle startup.StartupError errors
fn handle_startup_error(error: startup.StartupError) -> wisp.Response {
  case error {
    startup.DatabaseError(error) -> handle_database_error(error)
    startup.FailedToRegisterStartup -> wisp.internal_server_error()
    startup.InvalidStage(error) -> wisp.bad_request("Invalid stage: " <> error)

    startup.CnpjConflict(cnpj) ->
      wisp.response(409)
      |> wisp.string_body(
        "CNPJ " <> cnpj.to_string(cnpj) <> " is already in use",
      )

    startup.NotFound(id) ->
      wisp.not_found()
      |> wisp.string_body("Startup " <> uuid.to_string(id) <> " not found")

    startup.InvalidCnpj(value) ->
      wisp.bad_request("Invalid CNPJ format: " <> value)

    startup.InvalidMemberEmail(id:, value:) ->
      wisp.bad_request(
        "User "
        <> uuid.to_string(id)
        <> " has an invalid Email address: "
        <> value,
      )

    startup.AssignmentFailure(error) -> handle_startup_assignment_error(error)
  }
}

/// Handle startup.AssignmentError errors
fn handle_startup_assignment_error(
  error: startup.AssignmentError,
) -> wisp.Response {
  case error {
    // user errors -------------------------------------------------------------
    startup.FailedToAssignMember(id) ->
      wisp.internal_server_error()
      |> wisp.string_body("Failed to assign User " <> uuid.to_string(id))

    startup.MemberAssignmentConflict(id) ->
      wisp.response(409)
      |> wisp.string_body("User " <> uuid.to_string(id) <> " already assigned")

    startup.AssignedMissingUser(id) ->
      wisp.not_found()
      |> wisp.string_body("User " <> uuid.to_string(id) <> " not found")

    startup.AssignedMissingSegment(id) ->
      wisp.not_found()
      |> wisp.string_body("Segment " <> uuid.to_string(id) <> " not found")

    // segment errors ----------------------------------------------------------
    startup.FailedToAssignSegment(id) ->
      wisp.internal_server_error()
      |> wisp.string_body("Failed to assign Segment " <> uuid.to_string(id))

    startup.SegmentAssignmentConflict(id) ->
      wisp.response(409)
      |> wisp.string_body(
        "Segment " <> uuid.to_string(id) <> " already assigned",
      )

    // expertise errors --------------------------------------------------------
    startup.AssignedMissingExpertise(id) ->
      wisp.not_found()
      |> wisp.string_body("Expertise " <> uuid.to_string(id) <> " not found")

    startup.ExpertiseAssignmentConflict(id) ->
      wisp.response(409)
      |> wisp.string_body(
        "Expertise " <> uuid.to_string(id) <> " already assigned",
      )

    startup.FailedToAssignExpertise(id) ->
      wisp.internal_server_error()
      |> wisp.string_body("Failed to assign Expertise " <> uuid.to_string(id))

    // service errors ----------------------------------------------------------
    startup.AssignedMissingService(id) ->
      wisp.not_found()
      |> wisp.string_body("Service " <> uuid.to_string(id) <> " not found")

    startup.ServiceAssignmentConflict(id) ->
      wisp.response(409)
      |> wisp.string_body(
        "Service " <> uuid.to_string(id) <> " already assigned",
      )

    startup.FailedToAssignService(id) ->
      wisp.internal_server_error()
      |> wisp.string_body("Failed to assign Expertise " <> uuid.to_string(id))
  }
}

/// Handle user.UserError errors
fn handle_user_error(error: user.UserError) -> wisp.Response {
  case error {
    user.DatabaseError(error) -> handle_database_error(error)
    user.FailedToRegisterUser -> wisp.internal_server_error()
    user.HashError(_) -> wisp.internal_server_error()

    user.InvalidEmail(value) ->
      wisp.bad_request("Invalid email address: " <> value)

    user.NotFound(id) ->
      wisp.not_found()
      |> wisp.string_body("User " <> uuid.to_string(id) <> " not found.")

    // Usually this happens when a User is trying to login.
    user.EmailNotFound(_) | user.WrongPassword ->
      wisp.response(401)
      |> wisp.string_body("Wrong email or password")

    user.EmailConflict(email) ->
      wisp.response(409)
      |> wisp.string_body(
        "Email " <> email.to_string(email) <> " is already in use",
      )
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

/// **GET /api/auth/login**
///
/// Sets a session cookie if successful, it will last exactly one hour.
///
/// ## Request
///
/// ```json
/// {
///   "email": "wibble@email.com",
///   "password": "12345678"
/// }
/// ```
///
/// ## Response
///
/// - 200 OK if successful.
/// - 401 if email or password is incorrect.
/// - 400 if email is not a valid format.
///
pub fn handle_login(request: wisp.Request, context: Context) -> wisp.Response {
  use body <- wisp.require_json(request)

  case decode.run(body, login_decoder()) {
    Error(_errors) -> wisp.bad_request("Invalid JSON format")
    Ok(login) -> {
      let result =
        user.verify(
          context.database,
          email: login.email,
          password: login.password,
        )

      case result {
        Error(error) -> handle_user_error(error)
        Ok(user) ->
          wisp.set_cookie(
            response: wisp.ok(),
            request:,
            name: session_cookie,
            value: uuid.to_string(user.id),
            security: wisp.Signed,
            // One hour
            max_age: 60 * 60,
          )
      }
    }
  }
}

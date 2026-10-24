//// Http handlers and middlewares

import gleam/dynamic/decode
import gleam/float
import gleam/http
import gleam/http/request
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import gleam/time/duration
import lustre/attribute
import lustre/element
import lustre/element/html
import pog
import server/cnpj
import server/company
import server/email
import server/expertise
import server/internal
import server/internal/payload
import server/segment
import server/service
import server/startup
import server/technology
import wisp.{type Request, type Response}
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
  StartupError(error: startup.StartupError)
  /// Segment related errors
  SegmentError(error: segment.SegmentError)
  /// Technology related errors
  TechnologyError(error: technology.TechnologyError)
  /// Expertise related errors
  ExpertiseError(error: expertise.ExpertiseError)
  /// Service related errors
  ServiceError(error: service.ServiceError)
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
pub fn handle_request(request: Request, context: Context) -> Response {
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

    http.Post, ["api", "auth", "logout"] -> handle_logout(request)

    // Restore user session
    http.Get, ["api", "auth", "restore"] ->
      restore_session(request, context.database)

    // Refresh token duration
    http.Get, ["api", "auth", "refresh"] -> refresh_session(request)

    // +-----------------------------------------------------------------------+
    // | STARTUP                                                               |
    // +-----------------------------------------------------------------------+
    //
    // Querying, registering and assigning entities to startups.
    //
    http.Post, ["api", "startup"] -> register_startup(request, context.database)

    http.Get, ["api", "startup"] -> get_many_startups(request, context.database)
    http.Get, ["api", "startup", id] -> get_startup_by_id(context.database, id)

    // Fetching specific information about startups
    //
    // == segment ==============================================================
    http.Get, ["api", "segment", id] -> get_segment_by_id(context.database, id)

    http.Get, ["api", "segment"] -> get_many_segments(request, context.database)

    http.Get, ["api", "startup", id, "segment"] ->
      get_startup_segments(context.database, id)

    http.Post, ["api", "startup", id, "segment"] ->
      assign_startup_to_segment(request, context.database, id)

    http.Delete, ["api", "startup", id, "segment", segment_id] ->
      unassign_startup_from_segment(context.database, id, segment_id)

    // == service ==============================================================
    http.Get, ["api", "service", id] -> get_service_by_id(context.database, id)

    http.Get, ["api", "service"] -> get_many_services(request, context.database)

    http.Get, ["api", "startup", id, "service"] ->
      get_startup_services(context.database, id)

    http.Post, ["api", "startup", id, "service"] ->
      assign_startup_to_service(request, context.database, id)

    http.Delete, ["api", "startup", id, "service", service_id] ->
      unassign_startup_from_service(context.database, id, service_id)

    // == expertise ============================================================
    http.Get, ["api", "expertise", id] ->
      get_expertise_by_id(context.database, id)

    http.Get, ["api", "expertise"] ->
      get_many_expertises(request, context.database)

    http.Get, ["api", "startup", id, "expertise"] ->
      get_startup_expertises(context.database, id)

    http.Post, ["api", "startup", id, "expertise"] ->
      assign_startup_to_expertise(request, context.database, id)

    http.Delete, ["api", "startup", id, "expertise", expertise_id] ->
      unassign_startup_from_expertise(context.database, id, expertise_id)

    // == technology ===========================================================
    http.Get, ["api", "technology", id] ->
      get_technology_by_id(context.database, id)

    http.Get, ["api", "technology"] ->
      get_many_technologies(request, context.database)

    http.Get, ["api", "startup", id, "technology"] ->
      get_startup_technologies(context.database, id)

    http.Post, ["api", "startup", id, "technology"] ->
      assign_startup_to_technology(request, context.database, id)

    http.Delete, ["api", "startup", id, "technology", technology_id] ->
      unassign_startup_from_technology(context.database, id, technology_id)

    // +-----------------------------------------------------------------------+
    // | COMPANY                                                               |
    // +-----------------------------------------------------------------------+
    http.Post, ["api", "company"] -> register_company(request, context.database)
    http.Get, ["api", "company", id] -> get_company_by_id(context.database, id)

    // +-----------------------------------------------------------------------+
    // | NOT FOUND                                                             |
    // +-----------------------------------------------------------------------+
    //
    // Endpoint not found in the backend
    _, ["api", ..] -> wisp.not_found()

    // Page not found in the frontend
    _, _ -> get_root_document()
  }
}

/// ## `GET /api/segment/:id`
///
/// Fetch information about a Segment
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Tech",
///   "description": "Modern technology"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Segment is not found.
///
fn get_segment_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case segment.get(database, id) {
    Ok(data) ->
      segment.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_segment_error(error)
  }
}

/// ## `GET /api/technology/:id`
///
/// Fetch information about a Technology.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Gleam",
///   "description": "A friendly language for building type-safe systems"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Technology is not found.
///
fn get_technology_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case technology.get(database, id) {
    Ok(data) ->
      technology.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_technology_error(error)
  }
}

/// ## `GET /api/expertise/:id`
///
/// Fetch information about an Expertise.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Education",
///   "description": "Teaching and learning"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Expertise is not found.
///
fn get_expertise_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case expertise.get(database, id) {
    Ok(data) ->
      expertise.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_expertise_error(error)
  }
}

/// ## `GET /api/service/:id`
///
/// Fetch information about a Service.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Web development",
///   "description": "Websites and http servers"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if ID is not a valid UUID.
/// - **404** If Service is not found.
///
fn get_service_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case service.get(database, id) {
    Ok(data) ->
      service.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_service_error(error)
  }
}

/// ## `GET /api/company/:id`
///
/// Fetch information about a Company.
///
/// ## Examples
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Porto Digital",
///   "email": "porto@email.com",
///   "size": "micro",
///   "cnpj": "12345678901234",
///   "city": "Recife",
///   "state": "Pernambuco",
///   "created_at": "2026-09-14T20:08:02.000Z",
///   "is_active": true,
///   "website": "https://portodigital.org"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 404 If Startup is not found.
///
fn get_company_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case company.get(database, id) {
    Ok(data) ->
      company.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_company_error(error)
  }
}

/// ## `POST /api/startup/:id/segment`
///
/// Assign a Segment to a Startup
///
/// ## Request Body
///
/// ```json
/// {
///  "segment": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Tech",
///   "description": "Technology-related stuff"
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** if :id or :segment is not a valid UUID.
/// - **404** If Startup or Segment is not found.
///
fn assign_startup_to_segment(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)

  let decoder = {
    use segment <- decode.field("segment", internal.uuid_decoder())
    decode.success(segment)
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(segment) ->
      case startup.assign_segment(database, id, assign: segment) {
        Ok(data) ->
          segment.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }
  }
}

/// ## `POST /api/startup/:id/technology`
///
/// Assign a Technology to a Startup
///
/// ## Request Body
///
/// ```json
/// {
///   "technology": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Javascript",
///   "description": "dont",
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** if :id or :technology is not a valid UUID.
/// - **404** If Startup or Technology is not found.
///
fn assign_startup_to_technology(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)

  let decoder = {
    use technology <- decode.field("technology", internal.uuid_decoder())
    decode.success(technology)
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(technology) ->
      case startup.assign_technology(database, id, assign: technology) {
        Ok(data) ->
          technology.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }
  }
}

/// ## `POST /api/startup/:id/expertise`
///
/// Assign an Expertise to a Startup
///
/// ## Request Body
///
/// ```json
/// {
///  "expertise": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Education",
///   "description": "May it be free and for everyone"
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** if :id or :expertise is not a valid UUID.
/// - **404** If Startup or Expertise is not found.
///
fn assign_startup_to_expertise(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)

  let decoder = {
    use expertise <- decode.field("expertise", internal.uuid_decoder())
    decode.success(expertise)
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(expertise) ->
      case startup.assign_expertise(database, id, assign: expertise) {
        Ok(data) ->
          expertise.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }
  }
}

/// ## `POST /api/startup/:id/service`
///
/// Assign a Service to a Startup
///
/// ## Request Body
///
/// ```json
/// {
///  "service": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "UI/UX",
///   "description": "user experience"
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** if :id or :service is not a valid UUID.
/// - **404** If Startup or Service is not found.
///
fn assign_startup_to_service(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)

  let decoder = {
    use service <- decode.field("service", internal.uuid_decoder())
    decode.success(service)
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(service) ->
      case startup.assign_service(database, id, assign: service) {
        Ok(data) ->
          service.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }
  }
}

/// Checks if there's an active session token in the user request.
/// On sucess, the server will send Startup / Company JSON data to the client
/// depending on their previous session type.
///
/// > **NOTE:**  
/// > This function **does not** refresh the session token duration.
pub fn restore_session(request: Request, database: pog.Connection) -> Response {
  use session <- require_session(request)

  case session {
    Startup(id:) ->
      case startup.get(database, id) {
        Error(error) -> handle_startup_error(error)
        Ok(data) ->
          startup.to_json(data)
          |> json.to_string()
          |> wisp.json_response(200)
      }

    Company(id:) ->
      case company.get(database, id) {
        Error(error) -> handle_company_error(error)
        Ok(data) ->
          company.to_json(data)
          |> json.to_string()
          |> wisp.json_response(200)
      }
  }
}

/// Refresh the current session token duration.
///
/// ## Status Codes
///
/// - 200 if successfull
/// - 401 if token is missing
pub fn refresh_session(request: Request) -> Response {
  use session <- require_session(request)
  set_session_token(wisp.no_content(), request, session, duration.hours(1))
}

/// Sets to cookie duration to 0.
///
/// ## Status Codes
///
/// - 200 if successfull
/// - 401 if token is missing
fn handle_logout(request: Request) -> Response {
  use session <- require_session(request)
  set_session_token(wisp.no_content(), request, session, duration.seconds(0))
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
fn get_startup_expertises(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case startup.get_expertises(database, id) {
    Ok(data) ->
      json.array(data, expertise.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `DELETE /api/startup/:id/expertise/:expertise_id`
///
/// Unassign an Expertise from a Startup.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Education",
///   "description": "May it be free and for everyone"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if :id or :expertise_id is not a valid UUID.
/// - **404** If the Expertise is not assigned to the Startup.
///
fn unassign_startup_from_expertise(
  database: pog.Connection,
  id: String,
  expertise_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use expertise <- require_valid_uuid(expertise_id)

  case startup.unassign_expertise(database, id, unassign: expertise) {
    Ok(data) ->
      expertise.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// Return HTTP 401 if the Session token is not found
///
/// ## Examples
///
/// ```gleam
/// pub fn handle_request(request, context, id) -> wisp.Response {
///   use session <- require_session(request)
///   todo as "query protected data"
/// }
/// ```
pub fn require_session(
  request: Request,
  next: fn(Session) -> Response,
) -> Response {
  let decode_session = fn(value) {
    json.parse(value, session_decoder())
    |> result.replace_error(Nil)
  }

  let result =
    wisp.get_cookie(request, session_cookie, wisp.Signed)
    |> result.try(decode_session)

  case result {
    Ok(session) -> next(session)

    Error(_) ->
      "Missing session cookie"
      |> wisp.string_body(wisp.response(401), _)
  }
}

/// ## `GET /api/startup/:id/service`
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
fn get_startup_services(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case startup.get_services(database, id) {
    Ok(data) ->
      json.array(data, service.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `DELETE /api/startup/:id/service/:service_id`
///
/// Unassign a Service from a Startup.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "UI/UX",
///   "description": "user experience"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if :id or :service_id is not a valid UUID.
/// - **404** If the Service is not assigned to the Startup.
///
fn unassign_startup_from_service(
  database: pog.Connection,
  id: String,
  service_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use service <- require_valid_uuid(service_id)

  case startup.unassign_service(database, id, unassign: service) {
    Ok(data) ->
      service.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/:id/segment`
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
fn get_startup_segments(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case startup.get_segments(database, id) {
    Ok(data) ->
      json.array(data, segment.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `DELETE /api/startup/:id/segment/:segment_id`
///
/// Unassign a Segment from a Startup.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Tech",
///   "description": "Technology-related stuff"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if :id or :segment_id is not a valid UUID.
/// - **404** If the Segment is not assigned to the Startup.
///
fn unassign_startup_from_segment(
  database: pog.Connection,
  id: String,
  segment_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use segment <- require_valid_uuid(segment_id)

  case startup.unassign_segment(database, id, unassign: segment) {
    Ok(data) ->
      segment.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/:id/technology`
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
fn get_startup_technologies(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case startup.get_technologies(database, id) {
    Ok(data) ->
      json.array(data, technology.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `DELETE /api/startup/:id/technology/:technology_id`
///
/// Unassign a Technology from a Startup.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Javascript",
///   "description": "dont"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** if :id or :technology_id is not a valid UUID.
/// - **404** If the Technology is not assigned to the Startup.
///
fn unassign_startup_from_technology(
  database: pog.Connection,
  id: String,
  technology_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use technology <- require_valid_uuid(technology_id)

  case startup.unassign_technology(database, id, unassign: technology) {
    Ok(data) ->
      technology.to_json(data)
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
///    "email": "wibble@email.com",
///    "stage": "traction",
///    "cnpj": "12345678901234",
///    "description": "startup muito maneira",
///    "city": "Recife",
///    "state": "Pernambuco",
///    "created_at": "2026-09-14T20:08:02.000Z",
///    "is_active": true,
///    "website": "wibble.com"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Virada no Cafe",
///    "email": "wobble@email.com",
///    "stage": "scaling",
///    "cnpj": "12345678901234",
///    "description": "bem legal",
///    "city": "Recife",
///    "state": "Pernambuco",
///    "created_at": "2025-09-14T20:08:02.000Z",
///    "is_active": true,
///    "website": "wobble.com"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
fn get_many_startups(request: Request, database: pog.Connection) -> Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "offset")),
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

/// Handle [WebError](#WebError)
fn handle_error(error: WebError) -> Response {
  case error {
    StartupError(error) -> handle_startup_error(error)
    SegmentError(error) -> handle_segment_error(error)
    TechnologyError(error) -> handle_technology_error(error)
    ExpertiseError(error) -> handle_expertise_error(error)
    ServiceError(error) -> handle_service_error(error)
    MissingQuery -> wisp.bad_request("Missing query")
    InvalidQueryParameter(key:) -> wisp.bad_request("Invalid query: " <> key)
  }
}

fn handle_segment_error(error: segment.SegmentError) -> Response {
  case error {
    segment.DatabaseError(error:) -> handle_database_error(error)
    segment.FailedToRegisterSegment -> wisp.internal_server_error()
    segment.NotFound(_) -> wisp.not_found()
  }
}

fn handle_technology_error(error: technology.TechnologyError) -> Response {
  case error {
    technology.DatabaseError(error:) -> handle_database_error(error)
    technology.FailedToRegisterTechnology -> wisp.internal_server_error()
    technology.NotFound(_) -> wisp.not_found()
  }
}

fn handle_expertise_error(error: expertise.ExpertiseError) -> Response {
  case error {
    expertise.DatabaseError(error) -> handle_database_error(error)
    expertise.FailedToRegisterExpertise -> wisp.internal_server_error()
    expertise.NotFound(_) -> wisp.not_found()
  }
}

fn handle_service_error(error: service.ServiceError) -> Response {
  case error {
    service.DatabaseError(error:) -> handle_database_error(error)
    service.FailedToRegisterService -> wisp.internal_server_error()
    service.NotFound(_) -> wisp.not_found()
  }
}

/// ## `GET /api/segment`
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
///    "name": "Tech",
///    "description": "Technology"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Biotech",
///    "description": "Technology, but Bio"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
fn get_many_segments(request: Request, database: pog.Connection) -> Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "offset")),
    )

    segment.get_many(database, limit:, offset:)
    |> result.map_error(SegmentError)
  }

  case result {
    Ok(data) ->
      json.array(data, segment.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// ## `GET /api/technology`
///
/// Fetch a list of registered Technologies, pagination is available.
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
///    "name": "Gleam",
///    "description": "A friendly language for building type-safe systems"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "PostgreSQL",
///    "description": "The world's most advanced open source database"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
fn get_many_technologies(
  request: Request,
  database: pog.Connection,
) -> Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "offset")),
    )

    technology.get_many(database, limit:, offset:)
    |> result.map_error(TechnologyError)
  }

  case result {
    Ok(data) ->
      json.array(data, technology.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// ## `GET /api/expertise`
///
/// Fetch a list of registered Expertises, pagination is available.
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
///    "name": "Education",
///    "description": "Teaching and learning"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "Health",
///    "description": "Medical stuff"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
fn get_many_expertises(request: Request, database: pog.Connection) -> Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "offset")),
    )

    expertise.get_many(database, limit:, offset:)
    |> result.map_error(ExpertiseError)
  }

  case result {
    Ok(data) ->
      json.array(data, expertise.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// ## `GET /api/service`
///
/// Fetch a list of registered Services, pagination is available.
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
///    "name": "Web development",
///    "description": "Websites and http servers"
///   },
///   {
///    "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///    "name": "UI/UX",
///    "description": "user experience"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** if successful
/// - **400** if query is missing, invalid or incomplete.
///
fn get_many_services(request: Request, database: pog.Connection) -> Response {
  let result = {
    use query <- result.try(
      request.get_query(request)
      |> result.replace_error(MissingQuery),
    )

    use limit <- result.try(
      list.key_find(query, "limit")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "limit")),
    )

    use offset <- result.try(
      list.key_find(query, "offset")
      |> result.try(int.parse)
      |> result.replace_error(InvalidQueryParameter(key: "offset")),
    )

    service.get_many(database, limit:, offset:)
    |> result.map_error(ServiceError)
  }

  case result {
    Ok(data) ->
      json.array(data, service.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// Send the necessary HTML for the client-side application. The user will
/// use it to communicate with the Server.
fn get_root_document() -> Response {
  let body =
    html.html([attribute.lang("pt-BR")], [
      html.head([], [
        html.meta([attribute.charset("UTF-8")]),
        // Icon
        html.link([
          attribute.rel("icon"),
          attribute.type_("image/svg+xml"),
          attribute.href("/static/favicon.svg"),
        ]),

        // Meta tags
        html.meta([
          attribute.name("viewport"),
          attribute.content("width=device-width, initial-scale=1.0"),
        ]),

        html.meta([
          attribute.name("description"),
          attribute.content(
            "RecInTech conecta startups do Porto Digital a empresas que precisam
            de solução em tecnologia.",
          ),
        ]),

        // Preconnect links
        html.link([
          attribute.rel("preconnect"),
          attribute.href("https://fonts.googleapis.com"),
        ]),

        html.link([
          attribute.rel("preconnect"),
          attribute.href("https://fonts.gstatic.com"),
          attribute.crossorigin(""),
        ]),

        html.link([
          attribute.rel("stylesheet"),
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700
          &family=Space+Grotesk:wght@500;600;700&display=swap"
            // Gleam strings add a " " when there's a line break, so we need to remove it.
            |> string.replace(" ", "")
            |> attribute.href,
        ]),

        // +-------------------------------------------------------------------+
        // | CLIENT                                                            |
        // +-------------------------------------------------------------------+
        //
        // CSS
        html.link([
          attribute.rel("stylesheet"),
          attribute.crossorigin(""),
          attribute.href("/static/assets/client.css"),
        ]),

        // JAVASCRIPT
        html.script(
          [
            attribute.src("/static/assets/client.js"),
            attribute.type_("module"),
            attribute.crossorigin(""),
          ],
          "",
        ),

        // Page title
        html.title(
          [],
          "RecInTech — encontre a startup certa para o que sua empresa precisa",
        ),
      ]),

      html.body([], [html.div([attribute.id("root")], [])]),
    ])

  element.to_document_string(body)
  |> wisp.html_body(wisp.ok(), _)
}

fn middleware(
  request: Request,
  context: Context,
  next: fn(Request) -> Response,
) -> Response {
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
///   case startup.get(database, id) {
///     Ok(data) -> todo as "send response"
///     Error(error) -> todo as "handle error"
///   }
/// }
/// ```
pub fn require_valid_uuid(
  id: String,
  next: fn(uuid.Uuid) -> Response,
) -> Response {
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
///  "email": "critic@email.dev",
///  "stage": "traction",
///  "cnpj": "12345678901234",
///  "description": "startup muito maneira",
///  "city": "Recife",
///  "state": "Pernambuco",
///  "created_at": "2026-09-14T20:08:02.000Z",
///  "is_active": true,
///  "website": "criticlevel.dev"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 404 If Startup is not found.
///
fn get_startup_by_id(database: pog.Connection, id: String) -> Response {
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
fn handle_startup_error(error: startup.StartupError) -> Response {
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

    startup.InvalidEmail(value:) ->
      { "Invalid Email address: " <> value }
      |> wisp.bad_request

    startup.AssignmentFailure(id:) ->
      { "Failed to assign " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.internal_server_error(), _)

    startup.AssignmentConflict(id:) ->
      { uuid.to_string(id) <> " is already assigned" }
      |> wisp.string_body(wisp.response(409), _)

    startup.AssignmentNotFound(id:) ->
      { "Entity " <> uuid.to_string(id) <> " is not assigned to the Startup" }
      |> wisp.string_body(wisp.not_found(), _)

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

    startup.InvalidWebsite(value:) ->
      { "Invalid website: " <> value }
      |> wisp.bad_request
  }
}

/// Handle pog.QueryError errors
fn handle_database_error(error: pog.QueryError) -> Response {
  case error {
    pog.QueryTimeout | pog.ConnectionUnavailable -> wisp.response(503)

    pog.ConstraintViolated(..)
    | pog.PostgresqlError(..)
    | pog.UnexpectedArgumentCount(..)
    | pog.UnexpectedArgumentType(..)
    | pog.UnexpectedResultType(..) -> wisp.internal_server_error()
  }
}

/// A user can be logged in as an Startup or as an Company
pub type Session {
  Startup(id: uuid.Uuid)
  Company(id: uuid.Uuid)
}

/// Encode a Session into JSON
pub fn session_to_json(session: Session) -> json.Json {
  case session {
    Startup(id:) ->
      json.object([
        #("type", json.string("startup")),
        #("id", internal.uuid_to_json(id)),
      ])

    Company(id:) ->
      json.object([
        #("type", json.string("company")),
        #("id", internal.uuid_to_json(id)),
      ])
  }
}

/// A decoder that decodes `Session` values.
pub fn session_decoder() -> decode.Decoder(Session) {
  use variant <- decode.field("type", decode.string)

  case variant {
    "startup" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Startup(id:))
    }

    "company" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Company(id:))
    }

    _ -> decode.failure(Startup(id: uuid.v7()), "Session")
  }
}

/// Cookie storing the user session.
pub const session_cookie = "SESSION"

/// ## `POST /api/auth/login`
///
/// Sets a session cookie if successful, it will last exactly one hour.
/// The response body will include a Json string containing information about the
/// Startup / Company being authorized.
///
/// ## Request Body
///
/// ```jsonc
/// {
///   "session": "startup", // "startup" | "company"
///   "email": "wibble@email.com",
///   "password": "12345678"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 401 If email or password is incorrect.
/// - 400 If email is not a valid format.
///
fn handle_login(request: Request, database: pog.Connection) -> Response {
  use body <- wisp.require_json(request)
  let duration = duration.hours(1)

  // Custom decoder for the `Login` request body
  let decoder = {
    let kind_decoder = {
      use string <- decode.then(decode.string)
      case string {
        "startup" -> decode.success(string)
        "company" -> decode.success(string)
        other -> decode.failure(other, "session_kind")
      }
    }

    use session <- decode.field("session", kind_decoder)
    use email <- decode.field("email", email.decoder())
    use password <- decode.field("password", decode.string)
    decode.success(payload.Login(session:, email:, password:))
  }

  case decode.run(body, decoder) {
    // Startup session
    Ok(payload.Login(session: "startup", email:, password:)) ->
      case startup.verify(database, email:, password:) {
        Error(error) -> handle_startup_error(error)
        Ok(startup) ->
          startup.to_json(startup)
          |> json.to_string
          |> wisp.json_response(200)
          |> set_session_token(request, Startup(startup.id), duration)
      }

    // Company session
    Ok(payload.Login(session: "company", email:, password:)) ->
      case company.verify(database, email:, password:) {
        Error(error) -> handle_company_error(error)
        Ok(company) ->
          company.to_json(company)
          |> json.to_string
          |> wisp.json_response(200)
          |> set_session_token(request, Company(company.id), duration)
      }

    // Correct Json but invalid session type
    Ok(payload.Login(session:, ..)) ->
      wisp.bad_request("Invalid session type: " <> session)

    // Incorrect Json
    Error(_) -> wisp.bad_request("Invalid JSON format")
  }
}

/// Set a session cookie on the request.
fn set_session_token(
  response: Response,
  request: Request,
  session: Session,
  duration: duration.Duration,
) -> Response {
  let max_age =
    duration
    |> duration.to_seconds
    |> float.round

  session_to_json(session)
  |> json.to_string
  |> wisp.set_cookie(
    response:,
    request:,
    name: session_cookie,
    value: _,
    security: wisp.Signed,
    max_age:,
  )
}

/// ## `POST /api/startup`
///
/// Register a new Startup
///
/// ## Request Body
///
/// ```json
/// {
///  "name": "Recintech",
///  "email": "recintech@email.com",
///  "password": "12345678",
///  "cnpj": "12345678901234",
///  "stage": "traction",
///  "description": "startup muito maneira",
///  "city": "Recife",
///  "state": "Pernambuco",
///  "website": "https://recintech.dev"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 409 If duplicated email or cnpj.
///
fn register_startup(request: Request, database: pog.Connection) -> Response {
  use body <- wisp.require_json(request)

  let decoder = {
    use name <- decode.field("name", decode.string)
    use email <- decode.field("email", email.decoder())
    use password <- decode.field("password", decode.string)
    use cnpj <- decode.field("cnpj", cnpj.decoder())
    use stage <- decode.field("stage", startup.stage_decoder())
    use description <- decode.field("description", decode.string)
    use city <- decode.field("city", decode.string)
    use state <- decode.field("state", decode.string)
    use website <- decode.field("website", internal.uri_decoder())

    payload.RegisterStartup(
      name:,
      email:,
      password:,
      cnpj:,
      stage:,
      description:,
      city:,
      state:,
      website:,
    )
    |> decode.success
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid Json")
    Ok(data) -> {
      let result =
        startup.register(
          database,
          name: data.name,
          email: data.email,
          password: data.password,
          stage: data.stage,
          cnpj: data.cnpj,
          description: data.description,
          city: data.city,
          state: data.state,
          website: data.website,
        )

      case result {
        Ok(startup) ->
          startup.to_json(startup)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }
    }
  }
}

/// ## `POST /api/company`
///
/// Register a new Company
///
/// ## Request Body
///
/// ```json
/// {
///  "name": "Recintech",
///  "size": "micro",
///  "email": "recintech@email.com",
///  "password": "12345678",
///  "cnpj": "12345678901234",
///  "city": "Recife",
///  "state": "Pernambuco",
///  "website": "https://recintech.dev"
/// }
/// ```
///
/// ## Status Codes
///
/// - 200 If successful.
/// - 409 If duplicated email or cnpj.
///
fn register_company(request: Request, database: pog.Connection) -> Response {
  use body <- wisp.require_json(request)

  let decoder = {
    use name <- decode.field("name", decode.string)
    use size <- decode.field("size", company.size_decoder())
    use email <- decode.field("email", email.decoder())
    use password <- decode.field("password", decode.string)
    use cnpj <- decode.field("cnpj", cnpj.decoder())
    use city <- decode.field("city", decode.string)
    use state <- decode.field("state", decode.string)
    use website <- decode.field("website", internal.uri_decoder())

    payload.RegisterCompany(
      name:,
      size:,
      email:,
      password:,
      cnpj:,
      city:,
      state:,
      website:,
    )
    |> decode.success
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(body) -> {
      let register_result =
        company.register(
          database,
          name: body.name,
          size: body.size,
          email: body.email,
          cnpj: body.cnpj,
          password: body.password,
          city: body.city,
          state: body.state,
          website: body.website,
        )

      case register_result {
        Ok(data) ->
          company.to_json(data)
          |> json.to_string
          |> wisp.json_response(201)

        Error(error) -> handle_company_error(error)
      }
    }
  }
}

fn handle_company_error(error: company.CompanyError) -> Response {
  case error {
    company.DatabaseError(error:) -> handle_database_error(error)
    company.InvalidEmail(value:) -> wisp.bad_request("Invalid email: " <> value)
    company.HashError(_) -> wisp.internal_server_error()

    company.NotFound(id:) ->
      { "Company not found: " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.not_found(), _)

    company.InvalidCnpj(value:) -> wisp.bad_request("Invalid CNPJ: " <> value)

    company.InvalidWebsite(value:) ->
      wisp.bad_request("Invalid website: " <> value)

    company.EmailNotFound(_) | company.WrongPassword ->
      { "Wrong email or password" }
      |> wisp.string_body(wisp.response(401), _)

    company.CnpjConflict(value:) ->
      { "CNPJ already registered: " <> cnpj.to_string(value) }
      |> wisp.string_body(wisp.response(409), _)

    company.EmailConflict(value:) ->
      { "Email already registered: " <> email.to_string(value) }
      |> wisp.string_body(wisp.response(409), _)

    company.FailedToRegisterCompany ->
      "Failed to register Company"
      |> wisp.string_body(wisp.internal_server_error(), _)
  }
}

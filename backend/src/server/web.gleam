//// HTTP routing, handlers, sessions and error mapping for the RecInTech API.
////
//// This module is the boundary between the HTTP server and the rest of the
//// application.
////
//// Unknown paths under `/api` return `404 Not Found`. Any other unknown path
//// returns the single-page client document, which lets the frontend router
//// handle its own routes.
////
//// ## Authentication
////
//// Authentication is cookie-based. A successful `POST /api/auth/login` stores a
//// signed `SESSION` cookie containing a JSON value such as:
////
//// ```json
//// { "type": "startup", "id": "01a058ae-057f-73e8-b2a0-50986559767b" }
//// ```
////
//// The `type` field is either `"startup"` or `"company"`. Use
//// [`require_session`](#require_session),
//// [`require_startup_session`](#require_startup_session) and
//// [`require_company_session`](#require_company_session) to guard handlers.
////
//// ## Example
////
//// ```gleam
//// import server/web
////
//// pub fn main() {
////   let assert Ok(static_directory) = server.static_directory()
////
////   let context = web.Context(
////     database: database,
////     static_directory: static_directory
////   )
////
////   let response = web.handle_request(request, context)
////   assert response.status == 200
//// }
//// ```

import gleam/dynamic/decode
import gleam/float
import gleam/http
import gleam/http/request
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import gleam/time/duration
import gleam/uri
import lustre/attribute
import lustre/element
import lustre/element/html
import pog
import server/cnpj
import server/company
import server/company/demand
import server/email
import server/expertise
import server/internal
import server/internal/payload
import server/lgpd
import server/segment
import server/service
import server/startup
import server/technology
import wisp.{type Request, type Response}
import youid/uuid

/// Runtime dependencies shared by every request handler.
///
/// A single `Context` value is created at application startup and passed to
/// [`handle_request`](#handle_request) for each incoming request.
pub type Context {
  Context(
    /// PostgreSQL connection pool used by the service layer.
    ///
    /// The pool is shared by all handlers and is safe to reuse between
    /// requests.
    database: pog.Connection,
    /// Absolute path to the directory containing the application's static
    /// assets.
    ///
    /// Files below this directory are served under the `/static` URL prefix by
    /// the request middleware.
    static_directory: String,
  )
}

/// Errors that can occur while handling a request.
///
/// `WebError` unifies the errors raised by the different domains and by the
/// request parsing helpers. It is converted into an HTTP response by
/// [`handle_error`](#handle_error).
type WebError {
  /// An error returned by the startup domain.
  StartupError(error: startup.StartupError)
  /// An error returned by the segment domain.
  SegmentError(error: segment.SegmentError)
  /// An error returned by the company domain.
  CompanyError(error: company.CompanyError)
  /// An error returned by the technology domain.
  TechnologyError(error: technology.TechnologyError)
  /// An error returned by the expertise domain.
  ExpertiseError(error: expertise.ExpertiseError)
  /// An error returned by the service domain.
  ServiceError(error: service.ServiceError)
  /// An error returned by the demand domain.
  DemandError(error: demand.DemandError)
  /// The request has no query string.
  MissingQuery
  /// A required query parameter is missing or has an invalid value.
  InvalidQueryParameter(key: String)
  /// The requested LGPD policy version is not the current policy version.
  PolicyVersionMismatch(expected: Int, got: Int)
}

/// Route an HTTP request to its handler.
///
/// Requests to unknown `/api/...` paths return `404 Not Found`. Requests to any
/// other unknown path return the client-side application document, allowing the
/// frontend router to render its own 404 page.
///
/// The route handlers are documented individually below each handler function,
/// including their parameters, response bodies and status codes.
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
    http.Post, ["api", "startup"] -> register_startup(request, context.database)

    http.Patch, ["api", "startup", id] ->
      update_startup(request, context.database, id)

    http.Get, ["api", "startup"] -> get_many_startups(request, context.database)

    http.Get, ["api", "startup", id] -> get_startup_by_id(context.database, id)

    http.Get, ["api", "startup", id, "lgpd"] ->
      get_startup_lgpd_consent(context.database, id)

    http.Post, ["api", "startup", id, "lgpd", version] ->
      grant_startup_lgpd_consent(request, context.database, id, version)

    http.Delete, ["api", "startup", id, "lgpd", version] ->
      revoke_startup_lgpd_consent(request, context.database, id, version)

    // Fetching specific information about startups
    //
    // == segment ==============================================================
    http.Get, ["api", "segment", id] -> get_segment_by_id(context.database, id)

    http.Get, ["api", "segment"] -> get_many_segments(request, context.database)

    http.Get, ["api", "startup", id, "segment"] ->
      get_startup_segments(context.database, id)

    http.Post, ["api", "startup", id, "segment"] ->
      assign_segment_to_startup(request, context.database, id)

    http.Delete, ["api", "startup", id, "segment", segment_id] ->
      unassign_segment_from_startup(request, context.database, id, segment_id)

    // == service ==============================================================
    http.Get, ["api", "service", id] -> get_service_by_id(context.database, id)

    http.Get, ["api", "service"] -> get_many_services(request, context.database)

    http.Get, ["api", "startup", id, "service"] ->
      get_startup_services(context.database, id)

    http.Post, ["api", "startup", id, "service"] ->
      assign_service_to_startup(request, context.database, id)

    http.Delete, ["api", "startup", id, "service", service_id] ->
      unassign_service_from_startup(request, context.database, id, service_id)

    // == expertise ============================================================
    http.Get, ["api", "expertise", id] ->
      get_expertise_by_id(context.database, id)

    http.Get, ["api", "expertise"] ->
      get_many_expertises(request, context.database)

    http.Get, ["api", "startup", id, "expertise"] ->
      get_startup_expertises(context.database, id)

    http.Post, ["api", "startup", id, "expertise"] ->
      assign_expertise_to_startup(request, context.database, id)

    http.Delete, ["api", "startup", id, "expertise", expertise_id] ->
      unassign_expertise_from_expertise(context.database, id, expertise_id)

    // == technology ===========================================================
    http.Get, ["api", "technology", id] ->
      get_technology_by_id(context.database, id)

    http.Get, ["api", "technology"] ->
      get_many_technologies(request, context.database)

    http.Get, ["api", "startup", id, "technology"] ->
      get_startup_technologies(context.database, id)

    http.Post, ["api", "startup", id, "technology"] ->
      assign_technology_to_startup(request, context.database, id)

    http.Delete, ["api", "startup", id, "technology", technology_id] ->
      unassign_technology_from_startup(
        request,
        context.database,
        id,
        technology_id,
      )

    // +-----------------------------------------------------------------------+
    // | COMPANY                                                               |
    // +-----------------------------------------------------------------------+
    http.Post, ["api", "company"] -> register_company(request, context.database)

    http.Patch, ["api", "company", id] ->
      update_company(request, context.database, id)

    http.Get, ["api", "company", id] -> get_company_by_id(context.database, id)

    http.Get, ["api", "company", id, "demand"] ->
      get_company_demands(request, context.database, id)

    // == lgpd =================================================================
    http.Get, ["api", "company", id, "lgpd"] ->
      get_company_lgpd_consent(context.database, id)

    http.Post, ["api", "company", id, "lgpd", version] ->
      grant_company_lgpd_consent(request, context.database, id, version)

    http.Delete, ["api", "company", id, "lgpd", version] ->
      revoke_company_lgpd_consent(request, context.database, id, version)

    // == bookmarks ============================================================
    http.Get, ["api", "company", id, "bookmark"] ->
      get_company_bookmarks(request, context.database, id)

    http.Post, ["api", "company", id, "bookmark"] ->
      company_bookmark_startup(request, context.database, id)

    http.Delete, ["api", "company", id, "bookmark", startup] ->
      company_unbookmark_startup(context.database, id, startup)

    // +-----------------------------------------------------------------------+
    // | DEMAND                                                                |
    // +-----------------------------------------------------------------------+
    http.Get, ["api", "company", "demand", id] ->
      get_demand_by_id(context.database, id)

    http.Post, ["api", "company", id, "demand"] ->
      register_demand(request, context.database, id)

    http.Patch, ["api", "company", "demand", id] ->
      update_demand(request, context.database, id)

    http.Delete, ["api", "company", "demand", id] ->
      delete_demand(context.database, id)

    // == segment ==============================================================
    http.Get, ["api", "company", "demand", id, "segment"] ->
      get_demand_segments(context.database, id)

    http.Post, ["api", "company", "demand", id, "segment"] ->
      assign_segment_to_demand(request, context.database, id)

    http.Delete, ["api", "company", "demand", id, "segment", segment_id] ->
      unassign_segment_from_demand(context.database, id, segment_id)

    // == service ==============================================================
    http.Get, ["api", "company", "demand", id, "service"] ->
      get_demand_services(context.database, id)

    http.Post, ["api", "company", "demand", id, "service"] ->
      assign_service_to_demand(request, context.database, id)

    http.Delete, ["api", "company", "demand", id, "service", service_id] ->
      unassign_service_from_demand(context.database, id, service_id)

    // == technology ===========================================================
    http.Get, ["api", "company", "demand", id, "technology"] ->
      get_demand_technologies(context.database, id)

    http.Post, ["api", "company", "demand", id, "technology"] ->
      assign_technology_to_demand(request, context.database, id)

    http.Delete, ["api", "company", "demand", id, "technology", technology_id]
    -> unassign_technology_from_demand(context.database, id, technology_id)

    // == expertise ============================================================
    http.Get, ["api", "company", "demand", id, "expertise"] ->
      get_demand_expertises(context.database, id)

    http.Post, ["api", "company", "demand", id, "expertise"] ->
      assign_expertise_to_demand(request, context.database, id)

    http.Delete, ["api", "company", "demand", id, "expertise", expertise_id] ->
      unassign_expertise_from_demand(context.database, id, expertise_id)

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

/// Require an authenticated Startup session.
///
/// The `SESSION` cookie is decoded with [`require_session`](#require_session).
/// If the session belongs to a Startup, `next` is called with it. If the
/// session belongs to a Company, the request is rejected with `403 Forbidden`.
///
/// Handlers that operate on a specific Startup should also check that
/// `session.id` matches the Startup ID in the path.
///
/// ## Status Codes
///
/// - **401** If the session cookie is missing or invalid.
/// - **403** If the session belongs to a Company instead of a Startup.
///
/// ## Examples
///
/// ```gleam
/// pub fn update_profile(request: Request) -> Response {
///   use session <- require_startup_session(request)
///
///   // The session is now guaranteed to be a Startup session.
///   update_startup_profile(session.id, request)
/// }
/// ```
pub fn require_startup_session(
  request: Request,
  next: fn(Session) -> Response,
) -> Response {
  use session <- require_session(request)
  case session {
    Startup(_) -> next(session)
    Company(_) ->
      "Startup session is required"
      |> wisp.string_body(wisp.response(403), _)
  }
}

/// Require an authenticated Company session.
///
/// The `SESSION` cookie is decoded with [`require_session`](#require_session).
/// If the session belongs to a Company, `next` is called with it. If the
/// session belongs to a Startup, the request is rejected with `403 Forbidden`.
///
/// Handlers that operate on a specific Company should also check that
/// `session.id` matches the Company ID in the path.
///
/// ## Status Codes
///
/// - **401** If the session cookie is missing or invalid.
/// - **403** If the session belongs to a Startup instead of a Company.
///
/// ## Examples
///
/// ```gleam
/// pub fn update_profile(request: Request) -> Response {
///   use session <- require_company_session(request)
///
///   // The session is now guaranteed to be a Company session.
///   update_company_profile(session.id, request)
/// }
/// ```
pub fn require_company_session(
  request: Request,
  next: fn(Session) -> Response,
) -> Response {
  use session <- require_session(request)
  case session {
    Company(_) -> next(session)
    Startup(_) ->
      "Company session is required"
      |> wisp.string_body(wisp.response(403), _)
  }
}

/// ## `GET /api/company/:id/bookmark`
///
/// Fetch all Startups bookmarked by a Company, ordered by bookmark date.
/// Pagination is available.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Startups to return.
/// - `offset` (Int, required): the number of Startups to skip.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Critic Level",
///    "email": "critic@email.dev",
///    "stage": "traction",
///    "cnpj": "12345678901234",
///    "description": "startup muito maneira",
///    "city": "Recife",
///    "state": "Pernambuco",
///    "created_at": "2026-09-14T20:08:02.000Z",
///    "updated_at": "2026-09-14T20:08:02.000Z",
///    "is_active": true,
///    "website": "criticlevel.dev"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the Company ID is not a valid UUID, or the query is missing,
///   invalid or incomplete.
///
fn get_company_bookmarks(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)

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

    company.get_bookmarked_startups(database, id, limit:, offset:)
    |> result.map_error(CompanyError)
  }

  case result {
    Ok(startups) ->
      json.array(startups, startup.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// ## `POST /api/company/:id/bookmark`
///
/// Add a Startup to a Company's bookmarks.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Request Body
///
/// ```json
/// {
///   "startup": "01a058ae-057f-73e8-b2a0-50986559767b"
/// }
/// ```
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
/// - **201** If the Startup was bookmarked.
/// - **400** If the request body is invalid JSON, or the Company ID or Startup
///   ID is not a valid UUID.
/// - **404** If the Company or Startup is not found.
/// - **409** If the Startup is already bookmarked.
///
fn company_bookmark_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use body <- wisp.require_json(request)
  use id <- require_valid_uuid(id)

  let decoder = {
    use id <- decode.field("startup", internal.uuid_decoder())
    decode.success(id)
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(startup) ->
      case company.bookmark_startup(database, id, bookmark: startup) {
        Error(error) -> handle_company_error(error)
        Ok(startup) ->
          startup.to_json(startup)
          |> json.to_string()
          |> wisp.json_response(201)
      }
  }
}

/// ## `DELETE /api/company/:id/bookmark/:startup_id`
///
/// Remove a Startup from a Company's bookmarks.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
/// - `startup_id` (UUID, required): the bookmarked Startup's ID.
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
/// - **200** If the Startup was removed from the bookmarks.
/// - **400** If the Company ID or Startup ID is not a valid UUID.
/// - **404** If the Company, Startup or bookmark is not found.
///
fn company_unbookmark_startup(
  database: pog.Connection,
  id: String,
  startup: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use startup <- require_valid_uuid(startup)

  case company.unbookmark_startup(database, id, remove: startup) {
    Error(error) -> handle_company_error(error)
    Ok(startup) ->
      startup.to_json(startup)
      |> json.to_string()
      |> wisp.json_response(200)
  }
}

/// ## `GET /api/company/:id/lgpd`
///
/// Fetch all LGPD (Lei Geral de Proteção de Dados) consent records for a
/// Company, ordered by policy version.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///     "type": "granted",
///     "subject": {
///       "type": "company",
///       "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///     },
///     "updated_at": "2026-09-14T20:08:02.000Z",
///     "version": 1
///   },
///   {
///     "type": "revoked",
///     "subject": {
///       "type": "company",
///       "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///     },
///     "updated_at": "2026-09-14T20:08:02.000Z",
///     "version": 2
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
/// - **500** If the consent records could not be fetched.
///
fn get_company_lgpd_consent(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case company.get_lgpd_consent(database, id) {
    Ok(consent) ->
      json.array(consent, lgpd.consent_to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_company_error(error)
  }
}

/// ## `GET /api/startup/:id/lgpd`
///
/// Fetch all LGPD (Lei Geral de Proteção de Dados) consent records for a
/// Startup, ordered by policy version.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///     "type": "granted",
///     "subject": {
///       "type": "startup",
///       "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///     },
///     "updated_at": "2026-09-14T20:08:02.000Z",
///     "version": 1
///   },
///   {
///     "type": "revoked",
///     "subject": {
///       "type": "startup",
///       "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///     },
///     "updated_at": "2026-09-14T20:08:02.000Z",
///     "version": 2
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
/// - **500** If the consent records could not be fetched.
///
fn get_startup_lgpd_consent(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case startup.get_lgpd_consent(database, id) {
    Ok(consent) ->
      json.array(consent, lgpd.consent_to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_startup_error(error)
  }
}

/// ## `POST /api/startup/:id/lgpd/:version`
///
/// Grant LGPD (Lei Geral de Proteção de Dados) consent for a Startup at a
/// given policy version. Once granted, the Startup allows its data to be used
/// as described by that version of the privacy policy.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `version` (Int, required): the accepted policy version. Must be greater
///   than zero.
///
/// ## Response Body
///
/// ```json
/// {
///   "type": "granted",
///   "subject": {
///     "type": "startup",
///     "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///   },
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "version": 1
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, or the policy version is not a
///   valid integer greater than zero.
/// - **401** If not authenticated.
/// - **403** If the session is not a Startup session, or it belongs to a
///   different Startup.
/// - **404** If the Startup is not found.
/// - **500** If the consent could not be updated.
///
fn grant_startup_lgpd_consent(
  request: Request,
  database: pog.Connection,
  id: String,
  version: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use session <- require_startup_session(request)

  case int.parse(version) {
    Ok(version) if session.id == id -> {
      use <- require_latest_lgpd_policy(database, version)

      case lgpd.grant_consent(database, lgpd.Startup(id), version) {
        Ok(consent) ->
          lgpd.consent_to_json(consent)
          |> json.to_string()
          |> wisp.json_response(200)

        Error(error) -> handle_lgpd_error(error)
      }
    }

    Error(_) -> wisp.bad_request("Invalid policy version: " <> version)
    Ok(_) -> wisp.response(403)
  }
}

/// ## `DELETE /api/startup/:id/lgpd/:version`
///
/// Revoke LGPD (Lei Geral de Proteção de Dados) consent for a Startup at a
/// given policy version. Once revoked, the Startup no longer allows its data
/// to be used as described by that version of the privacy policy.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `version` (Int, required): the revoked policy version. Must be greater
///   than zero.
///
/// ## Response Body
///
/// ```json
/// {
///   "type": "revoked",
///   "subject": {
///     "type": "startup",
///     "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///   },
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "version": 1
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, or the policy version is not a
///   valid integer greater than zero.
/// - **401** If not authenticated
/// - **403** If the session is not a Startup session, or it belongs to a
///   different Startup.
/// - **404** If the Startup is not found.
/// - **500** If the consent could not be updated.
///
fn revoke_startup_lgpd_consent(
  request: Request,
  database: pog.Connection,
  id: String,
  version: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use session <- require_startup_session(request)

  case int.parse(version) {
    Ok(version) if session.id == id -> {
      use <- require_latest_lgpd_policy(database, version)

      case lgpd.revoke_consent(database, lgpd.Startup(id), version) {
        Ok(consent) ->
          lgpd.consent_to_json(consent)
          |> json.to_string()
          |> wisp.json_response(200)

        Error(error) -> handle_lgpd_error(error)
      }
    }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid policy version: " <> version)
  }
}

/// ## `POST /api/company/:id/lgpd/:version`
///
/// Grant LGPD (Lei Geral de Proteção de Dados) consent for a Company at a
/// given policy version. Once granted, the Company allows its data to be used
/// as described by that version of the privacy policy.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
/// - `version` (Int, required): the accepted policy version. Must be greater
///   than zero.
///
/// ## Response Body
///
/// ```json
/// {
///   "type": "granted",
///   "subject": {
///     "type": "company",
///     "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///   },
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "version": 1
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, or the policy version is not a
///   valid integer greater than zero.
/// - **401** If not authenticated.
/// - **403** If the session is not a Company session, or it belongs to a
///   different Company.
/// - **404** If the Company is not found.
/// - **500** If the consent could not be updated.
///
fn grant_company_lgpd_consent(
  request: Request,
  database: pog.Connection,
  id: String,
  version: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use session <- require_company_session(request)

  case int.parse(version) {
    Ok(version) if session.id == id -> {
      use <- require_latest_lgpd_policy(database, version)

      case lgpd.grant_consent(database, lgpd.Company(id), version) {
        Ok(consent) ->
          lgpd.consent_to_json(consent)
          |> json.to_string()
          |> wisp.json_response(200)

        Error(error) -> handle_lgpd_error(error)
      }
    }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid policy version: " <> version)
  }
}

/// Require `version` to be the current LGPD policy version.
///
/// The current policy version is read from the database. If it matches, `next`
/// is called; otherwise the request is rejected with `400 Bad Request`.
fn require_latest_lgpd_policy(
  database: pog.Connection,
  version: Int,
  next: fn() -> Response,
) -> Response {
  case lgpd.get_current_policy(database) {
    Error(error) -> handle_lgpd_error(error)
    Ok(policy) if policy.version == version -> next()

    Ok(policy) ->
      handle_error(PolicyVersionMismatch(expected: policy.version, got: version))
  }
}

/// ## `DELETE /api/company/:id/lgpd/:version`
///
/// Revoke LGPD (Lei Geral de Proteção de Dados) consent for a Company at a
/// given policy version. Once revoked, the Company no longer allows its data
/// to be used as described by that version of the privacy policy.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
/// - `version` (Int, required): the revoked policy version. Must be greater
///   than zero.
///
/// ## Response Body
///
/// ```json
/// {
///   "type": "revoked",
///   "subject": {
///     "type": "company",
///     "id": "01a058ae-057f-73e8-b2a0-50986559767b"
///   },
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "version": 1
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, or the policy version is not a
///   valid integer greater than zero.
/// - **401** If not authenticated.
/// - **403** If the session is not a Company session, or it belongs to a
///   different Company.
/// - **404** If the Company is not found.
/// - **500** If the consent could not be updated.
///
fn revoke_company_lgpd_consent(
  request: Request,
  database: pog.Connection,
  id: String,
  version: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use session <- require_company_session(request)

  case int.parse(version) {
    Ok(version) if session.id == id -> {
      use <- require_latest_lgpd_policy(database, version)

      case lgpd.revoke_consent(database, lgpd.Company(id), version) {
        Ok(consent) ->
          lgpd.consent_to_json(consent)
          |> json.to_string()
          |> wisp.json_response(200)

        Error(error) -> handle_lgpd_error(error)
      }
    }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid policy version: " <> version)
  }
}

/// Convert an LGPD error into an HTTP response.
fn handle_lgpd_error(error: lgpd.LgpdError) -> Response {
  case error {
    lgpd.DatabaseError(_) -> wisp.internal_server_error()

    lgpd.SubjectNotFound(id) ->
      { "ID not found:" <> uuid.to_string(id) }
      |> wisp.string_body(wisp.not_found(), _)

    lgpd.InvalidPolicyVersion(version:) ->
      wisp.bad_request("Invalid policy version: " <> int.to_string(version))

    lgpd.FailedToUpdateConsent(_) ->
      { "Failed to update consent" }
      |> wisp.string_body(wisp.internal_server_error(), _)

    lgpd.PolicyNotFound(version:) ->
      { "Policy not found: Version " <> int.to_string(version) }
      |> wisp.string_body(wisp.not_found(), _)

    lgpd.CurrentPolicyNotFound ->
      { "No current policy found" }
      |> wisp.string_body(wisp.not_found(), _)

    lgpd.PolicyVersionConflict(version) ->
      { "Policy version already registered: " <> int.to_string(version) }
      |> wisp.string_body(wisp.response(409), _)

    lgpd.FailedToUpdatePolicy(version:) ->
      { "Failed to update policy: " <> int.to_string(version) }
      |> wisp.string_body(wisp.internal_server_error(), _)
  }
}

/// ## `PATCH /api/startup/:id`
///
/// Update information about a Startup. Missing fields and empty strings are
/// ignored.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID. It must match the Startup ID in
///   the current session.
///
/// ## Request Body
///
/// ```json
/// {
///   "name": "Virada no Cafe",
///   "email": "contact@viradanocafe.com",
///   "stage": "scaling",
///   "cnpj": "12345678901234",
///   "description": "Inovacao periferica que transforma",
///   "city": "Olinda",
///   "state": "Pernambuco",
///   "website": "https://viradanocafe.com"
/// }
/// ```
///
/// - All fields are optional.
/// - `stage`: either `"traction"` or `"scaling"`.
/// - Empty strings are treated as missing fields.
///
/// ## Response Body
///
/// ```json
/// {
///  "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///  "name": "Virada no Cafe",
///  "email": "contact@viradanocafe.com",
///  "stage": "scaling",
///  "cnpj": "12345678901234",
///  "description": "Inovacao periferica que transforma",
///  "city": "Olinda",
///  "state": "Pernambuco",
///  "created_at": "2026-09-14T20:08:02.000Z",
///  "is_active": true,
///  "website": "https://viradanocafe.com"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, the request body is invalid JSON,
///   or a field has an invalid value.
/// - **401** If not authenticated.
/// - **403** If the session is not a Startup session, or it belongs to a
///   different Startup.
/// - **404** If the Startup is not found.
/// - **409** If the new email or CNPJ is already in use.
///
fn update_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use body <- wisp.require_json(request)
  use id <- require_valid_uuid(id)
  use session <- require_startup_session(request)

  let decoder = {
    use name <- decode.optional_field("name", "", decode.string)
    use description <- decode.optional_field("description", "", decode.string)
    use city <- decode.optional_field("city", "", decode.string)
    use state <- decode.optional_field("state", "", decode.string)

    use website <- decode.optional_field(
      "website",
      uri.empty,
      internal.uri_decoder(),
    )

    use stage <- decode.optional_field(
      "stage",
      None,
      decode.optional(startup.stage_decoder()),
    )

    use email <- decode.optional_field(
      "email",
      None,
      decode.optional(email.decoder()),
    )

    use cnpj <- decode.optional_field(
      "cnpj",
      None,
      decode.optional(cnpj.decoder()),
    )

    decode.success(payload.UpdateStartup(
      name:,
      stage:,
      email:,
      cnpj:,
      description:,
      city:,
      state:,
      website:,
    ))
  }

  case decode.run(body, decoder) {
    Ok(payload) if session.id == id -> {
      let website = case payload.website == uri.empty {
        True -> None
        False -> Some(payload.website)
      }

      let result =
        startup.update(
          database,
          id,
          new_name: string.to_option(payload.name),
          new_stage: payload.stage,
          new_email: payload.email,
          new_cnpj: payload.cnpj,
          new_description: string.to_option(payload.description),
          new_city: string.to_option(payload.city),
          new_state: string.to_option(payload.state),
          new_website: website,
        )
        |> result.map_error(StartupError)

      case result {
        Ok(startup) ->
          startup.to_json(startup)
          |> json.to_string
          |> wisp.json_response(200)

        Error(error) -> handle_error(error)
      }
    }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `DELETE /api/company/demand/:id`
///
/// Delete a registered Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
///
/// ## Response Body
///
/// The deleted Demand:
///
/// ```json
/// {
///   "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///   "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///   "title": "Need more gleam projects",
///   "description": "A lot more of them",
///   "status": "open",
///   "created_at": "2025-09-14T20:08:02.000Z",
///   "updated_at": "2025-09-14T20:08:02.000Z"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If the Demand was deleted.
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Demand is not found.
///
fn delete_demand(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.delete(database, id) {
    Ok(data) ->
      demand.to_json(data)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `POST /api/company/:id/demand`
///
/// Register a new Demand for a Company. Segments, Services, Expertises and
/// Technologies can be assigned to the Demand in the same request.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Request Body
///
/// ```json
/// {
///   "title": "Need more gleam projects",
///   "description": "A lot more of them",
///   "status": "open",
///   "segments": ["01a058ae-057f-73e8-b2a0-50986559767b"],
///   "services": ["01a0dbb3-153a-7b84-8c3d-631788972d4a"],
///   "expertises": ["01a173cb-9533-7ebd-87a0-590965ef3653"],
///   "technologies": ["01a173cb-9533-7eb5-9522-9686fef4f2a4"]
/// }
/// ```
///
/// - `status`: one of `"open"`, `"closed"` or `"canceled"`.
/// - `segments`, `services`, `expertises` and `technologies`: lists of UUIDs.
///   The lists may be empty, but all four fields are required.
///
/// ## Response Body
///
/// ```json
/// {
///   "demand": {
///     "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///     "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///     "title": "Need more gleam projects",
///     "description": "A lot more of them",
///     "status": "open",
///     "created_at": "2025-09-14T20:08:02.000Z",
///     "updated_at": "2025-09-14T20:08:02.000Z"
///   },
///   "expertises": [
///     {
///       "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///       "name": "Education",
///       "description": "Teaching and learning"
///     }
///   ],
///   "segments": [
///     {
///       "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///       "name": "Tech",
///       "description": "Technology"
///     }
///   ],
///   "services": [
///     {
///       "id": "01a0dbb3-153a-7b84-8c3d-631788972d4a",
///       "name": "Web development",
///       "description": "Websites and http servers"
///     }
///   ],
///   "technologies": [
///     {
///       "id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///       "name": "Gleam",
///       "description": "A friendly language for building type-safe systems"
///     }
///   ]
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** If the Company ID or any provided entity ID is not a valid UUID,
///   or the request body is invalid JSON.
/// - **404** If the Company, or any assigned entity, is not found.
/// - **409** If an entity is already assigned to the Demand.
///
fn register_demand(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use body <- wisp.require_json(request)
  use id <- require_valid_uuid(id)

  let decoder = {
    use title <- decode.field("title", decode.string)
    use description <- decode.field("description", decode.string)
    use status <- decode.field("status", demand.status_decoder())

    use segments <- decode.field(
      "segments",
      decode.list(internal.uuid_decoder()),
    )

    use services <- decode.field(
      "services",
      decode.list(internal.uuid_decoder()),
    )

    use expertises <- decode.field(
      "expertises",
      decode.list(internal.uuid_decoder()),
    )

    use technologies <- decode.field(
      "technologies",
      decode.list(internal.uuid_decoder()),
    )

    decode.success(payload.RegisterDemand(
      title:,
      description:,
      status:,
      expertises:,
      segments:,
      services:,
      technologies:,
    ))
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(payload) -> {
      let result = {
        use demand <- result.try(
          demand.register(
            database,
            company_id: id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
          )
          |> result.map_error(DemandError),
        )

        use expertises <- result.try(
          list.try_map(payload.expertises, demand.assign_expertise(
            database,
            demand.id,
            assign: _,
          ))
          |> result.map_error(DemandError),
        )

        use segments <- result.try(
          list.try_map(payload.segments, demand.assign_segment(
            database,
            demand.id,
            assign: _,
          ))
          |> result.map_error(DemandError),
        )

        use services <- result.try(
          list.try_map(payload.services, demand.assign_service(
            database,
            demand.id,
            assign: _,
          ))
          |> result.map_error(DemandError),
        )

        use technologies <- result.map(
          list.try_map(payload.technologies, demand.assign_technology(
            database,
            demand.id,
            assign: _,
          ))
          |> result.map_error(DemandError),
        )

        json.object([
          #("demand", demand.to_json(demand)),
          #("expertises", json.array(expertises, expertise.to_json)),
          #("segments", json.array(segments, segment.to_json)),
          #("services", json.array(services, service.to_json)),
          #("technologies", json.array(technologies, technology.to_json)),
        ])
      }

      case result {
        Error(error) -> handle_error(error)

        Ok(body) ->
          json.to_string(body)
          |> wisp.json_response(201)
      }
    }
  }
}

/// ## `PATCH /api/company/demand/:id`
///
/// Update information about a Demand. Missing fields and empty strings are
/// ignored.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
///
/// ## Request Body
///
/// ```json
/// {
///   "title": "new title",
///   "description": "new description"
/// }
/// ```
///
/// - Both fields are optional.
/// - Empty strings are treated as missing fields.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///   "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///   "title": "new title",
///   "description": "new description",
///   "status": "open",
///   "created_at": "2025-09-14T20:08:02.000Z",
///   "updated_at": "2025-09-14T20:08:02.000Z"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If the Demand was updated.
/// - **400** If the ID is not a valid UUID or the request body is invalid JSON.
/// - **404** If the Demand is not found.
///
fn update_demand(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use body <- wisp.require_json(request)
  use id <- require_valid_uuid(id)

  let decoder = {
    use title <- decode.optional_field("title", "", decode.string)
    use description <- decode.optional_field("description", "", decode.string)
    decode.success(payload.UpdateDemand(title:, description:))
  }

  case decode.run(body, decoder) {
    Error(_) -> wisp.bad_request("Invalid JSON")
    Ok(payload) -> {
      let new_title = string.to_option(payload.title)
      let new_description = string.to_option(payload.description)

      case demand.update(database, id, new_title:, new_description:) {
        Error(error) -> handle_demand_error(error)

        Ok(demand) ->
          demand.to_json(demand)
          |> json.to_string
          |> wisp.json_response(200)
      }
    }
  }
}

/// ## `GET /api/company/demand/:id`
///
/// Fetch information about a Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///   "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///   "title": "Need more gleam projects",
///   "description": "A lot more of them",
///   "status": "open",
///   "created_at": "2025-09-14T20:08:02.000Z",
///   "updated_at": "2025-09-14T20:08:02.000Z"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Demand is not found.
///
fn get_demand_by_id(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.get(database, id) {
    Ok(demand) ->
      demand.to_json(demand)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `GET /api/company/:id/demand`
///
/// Fetch all Demands assigned to a Company.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Demands to return.
/// - `offset` (Int, required): the number of Demands to skip.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///     "id": "01a173cb-9533-7ebd-87a0-590965ef3653",
///     "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///     "title": "Need more gleam projects",
///     "description": "A lot more of them",
///     "status": "open",
///     "created_at": "2025-09-14T20:08:02.000Z",
///     "updated_at": "2025-09-14T20:08:02.000Z"
///   },
///   {
///     "id": "01a173cb-9533-7ebd-87a0-283915ef3653",
///     "company_id": "01a173cb-9533-7eb5-9522-9686fef4f2a4",
///     "title": "Need more Zig projects",
///     "description": "",
///     "status": "open",
///     "created_at": "2026-09-19T20:08:02.000Z",
///     "updated_at": "2026-09-19T20:08:02.000Z"
///   }
/// ]
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, or the query is missing, invalid
///   or incomplete.
///
fn get_company_demands(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)

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

    company.get_demands(database, from: id, limit:, offset:)
    |> result.map_error(CompanyError)
  }

  case result {
    Ok(demands) ->
      json.array(demands, demand.to_json)
      |> json.to_string
      |> wisp.json_response(200)

    Error(error) -> handle_error(error)
  }
}

/// ## `GET /api/company/demand/:id/segment`
///
/// Fetch all Segments assigned to a Demand.
///
/// Returns an empty list if the Demand does not exist or has no assigned
/// segments.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
///
fn get_demand_segments(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.get_segments(database, id) {
    Ok(data) ->
      json.array(data, segment.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `GET /api/company/demand/:id/service`
///
/// Fetch all Services assigned to a Demand.
///
/// Returns an empty list if the Demand does not exist or has no assigned
/// services.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **400** If the ID is not a valid UUID.
///
fn get_demand_services(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.get_services(database, id) {
    Ok(data) ->
      json.array(data, service.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `GET /api/company/demand/:id/technology`
///
/// Fetch all Technologies assigned to a Demand.
///
/// Returns an empty list if the Demand does not exist or has no assigned
/// technologies.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
///
fn get_demand_technologies(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.get_technologies(database, id) {
    Ok(data) ->
      json.array(data, technology.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `GET /api/company/demand/:id/expertise`
///
/// Fetch all Expertises assigned to a Demand.
///
/// Returns an empty list if the Demand does not exist or has no assigned
/// expertises.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
///
fn get_demand_expertises(database: pog.Connection, id: String) -> Response {
  use id <- require_valid_uuid(id)

  case demand.get_expertises(database, id) {
    Ok(data) ->
      json.array(data, expertise.to_json)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `POST /api/company/demand/:id/segment`
///
/// Assign a Segment to a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **400** If the ID or the segment ID is not a valid UUID.
/// - **404** If Demand or Segment is not found.
/// - **409** If Segment is already assigned to the Demand.
///
fn assign_segment_to_demand(
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
      case demand.assign_segment(database, id, assign: segment) {
        Ok(data) ->
          segment.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_demand_error(error)
      }
  }
}

/// ## `DELETE /api/company/demand/:id/segment/:segment_id`
///
/// Unassign a Segment from a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
/// - `segment_id` (UUID, required): the Segment's ID.
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
/// - **400** If the ID or the segment ID is not a valid UUID.
/// - **404** If the Segment is not assigned to the Demand.
///
fn unassign_segment_from_demand(
  database: pog.Connection,
  id: String,
  segment_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use segment <- require_valid_uuid(segment_id)

  case demand.unassign_segment(database, id, unassign: segment) {
    Ok(data) ->
      segment.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `POST /api/company/demand/:id/service`
///
/// Assign a Service to a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **400** If the ID or the service ID is not a valid UUID.
/// - **404** If Demand or Service is not found.
/// - **409** If Service is already assigned to the Demand.
///
fn assign_service_to_demand(
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
      case demand.assign_service(database, id, assign: service) {
        Ok(data) ->
          service.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_demand_error(error)
      }
  }
}

/// ## `DELETE /api/company/demand/:id/service/:service_id`
///
/// Unassign a Service from a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
/// - `service_id` (UUID, required): the Service's ID.
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
/// - **400** If the ID or the service ID is not a valid UUID.
/// - **404** If the Service is not assigned to the Demand.
///
fn unassign_service_from_demand(
  database: pog.Connection,
  id: String,
  service_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use service <- require_valid_uuid(service_id)

  case demand.unassign_service(database, id, unassign: service) {
    Ok(data) ->
      service.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `POST /api/company/demand/:id/technology`
///
/// Assign a Technology to a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
///
/// ## Request Body
///
/// ```json
/// {
///  "technology": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b"
/// }
/// ```
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Gleam",
///   "description": "A friendly language for building type-safe systems"
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** If the ID or the technology ID is not a valid UUID.
/// - **404** If Demand or Technology is not found.
/// - **409** If Technology is already assigned to the Demand.
///
fn assign_technology_to_demand(
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
      case demand.assign_technology(database, id, assign: technology) {
        Ok(data) ->
          technology.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_demand_error(error)
      }
  }
}

/// ## `DELETE /api/company/demand/:id/technology/:technology_id`
///
/// Unassign a Technology from a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
/// - `technology_id` (UUID, required): the Technology's ID.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a155b2-69c7-75d7-8cc1-8d2626c6bc9b",
///   "name": "Gleam",
///   "description": "A friendly language for building type-safe systems"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID or the technology ID is not a valid UUID.
/// - **404** If the Technology is not assigned to the Demand.
///
fn unassign_technology_from_demand(
  database: pog.Connection,
  id: String,
  technology_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use technology <- require_valid_uuid(technology_id)

  case demand.unassign_technology(database, id, unassign: technology) {
    Ok(data) ->
      technology.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `POST /api/company/demand/:id/expertise`
///
/// Assign an Expertise to a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
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
/// - **400** If the ID or the expertise ID is not a valid UUID.
/// - **404** If Demand or Expertise is not found.
/// - **409** If Expertise is already assigned to the Demand.
///
fn assign_expertise_to_demand(
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
      case demand.assign_expertise(database, id, assign: expertise) {
        Ok(data) ->
          expertise.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_demand_error(error)
      }
  }
}

/// ## `DELETE /api/company/demand/:id/expertise/:expertise_id`
///
/// Unassign an Expertise from a Company's Demand.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Demand's ID.
/// - `expertise_id` (UUID, required): the Expertise's ID.
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
/// - **400** If the ID or the expertise ID is not a valid UUID.
/// - **404** If the Expertise is not assigned to the Demand.
///
fn unassign_expertise_from_demand(
  database: pog.Connection,
  id: String,
  expertise_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use expertise <- require_valid_uuid(expertise_id)

  case demand.unassign_expertise(database, id, unassign: expertise) {
    Ok(data) ->
      expertise.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Error(error) -> handle_demand_error(error)
  }
}

/// ## `GET /api/segment/:id`
///
/// Fetch information about a Segment.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Segment's ID.
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
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Segment is not found.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Technology's ID.
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
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Technology is not found.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Expertise's ID.
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
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Expertise is not found.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Service's ID.
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
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Service is not found.
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

/// ## `PATCH /api/company/:id`
///
/// Update information about a Company. Missing fields and empty strings are
/// ignored.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID. It must match the Company ID in
///   the current session.
///
/// ## Request Body
///
/// ```json
/// {
///   "name": "Porto Digital",
///   "email": "porto@email.com",
///   "size": "medium",
///   "cnpj": "12345678901234",
///   "city": "Recife",
///   "state": "Pernambuco",
///   "website": "https://portodigital.org"
/// }
/// ```
///
/// - All fields are optional.
/// - `size`: one of `"micro"`, `"small"`, `"medium"` or `"big"`.
/// - Empty strings are treated as missing fields.
///
/// ## Response Body
///
/// ```json
/// {
///   "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///   "name": "Porto Digital",
///   "email": "porto@email.com",
///   "size": "medium",
///   "cnpj": "12345678901234",
///   "city": "Recife",
///   "state": "Pernambuco",
///   "created_at": "2026-09-14T20:08:02.000Z",
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "is_active": true,
///   "website": "https://portodigital.org"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID, the request body is invalid JSON,
///   or a field has an invalid value.
/// - **401** If not authenticated.
/// - **403** If the session is not a Company session, or it belongs to a
///   different Company.
/// - **404** If the Company is not found.
/// - **409** If the new email or CNPJ is already in use.
///
fn update_company(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use body <- wisp.require_json(request)
  use id <- require_valid_uuid(id)
  use session <- require_company_session(request)

  let decoder = {
    use name <- decode.optional_field("name", "", decode.string)
    use city <- decode.optional_field("city", "", decode.string)
    use state <- decode.optional_field("state", "", decode.string)

    use website <- decode.optional_field(
      "website",
      uri.empty,
      internal.uri_decoder(),
    )

    use size <- decode.optional_field(
      "size",
      None,
      decode.optional(company.size_decoder()),
    )

    use email <- decode.optional_field(
      "email",
      None,
      decode.optional(email.decoder()),
    )

    use cnpj <- decode.optional_field(
      "cnpj",
      None,
      decode.optional(cnpj.decoder()),
    )

    decode.success(payload.UpdateCompany(
      name:,
      size:,
      email:,
      cnpj:,
      city:,
      state:,
      website:,
    ))
  }

  case decode.run(body, decoder) {
    Ok(payload) if session.id == id -> {
      let website = case payload.website == uri.empty {
        True -> None
        False -> Some(payload.website)
      }

      let result =
        company.update(
          database,
          id,
          new_name: string.to_option(payload.name),
          new_size: payload.size,
          new_email: payload.email,
          new_cnpj: payload.cnpj,
          new_city: string.to_option(payload.city),
          new_state: string.to_option(payload.state),
          new_website: website,
        )
        |> result.map_error(CompanyError)

      case result {
        Ok(company) ->
          company.to_json(company)
          |> json.to_string
          |> wisp.json_response(200)

        Error(error) -> handle_error(error)
      }
    }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `GET /api/company/:id`
///
/// Fetch information about a Company.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Company's ID.
///
/// ## Response Body
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
///   "updated_at": "2026-09-14T20:08:02.000Z",
///   "is_active": true,
///   "website": "https://portodigital.org"
/// }
/// ```
///
/// ## Status Codes
///
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Company is not found.
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
/// Assign a Segment to a Startup.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **400** If the ID or the segment ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If Startup or Segment is not found.
/// - **409** If Segment is already assigned to the Startup.
///
fn assign_segment_to_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)
  use session <- require_startup_session(request)

  let decoder = {
    use segment <- decode.field("segment", internal.uuid_decoder())
    decode.success(segment)
  }

  case decode.run(body, decoder) {
    Ok(segment) if session.id == id ->
      case startup.assign_segment(database, id, assign: segment) {
        Ok(data) ->
          segment.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `POST /api/startup/:id/technology`
///
/// Assign a Technology to a Startup.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
///   "name": "Gleam",
///   "description": "A friendly language for building type-safe systems"
/// }
/// ```
///
/// ## Status Codes
///
/// - **201** If successful.
/// - **400** If the ID or the technology ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If Startup or Technology is not found.
/// - **409** If Technology is already assigned to the Startup.
///
fn assign_technology_to_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)
  use session <- require_startup_session(request)

  let decoder = {
    use technology <- decode.field("technology", internal.uuid_decoder())
    decode.success(technology)
  }

  case decode.run(body, decoder) {
    Ok(technology) if session.id == id ->
      case startup.assign_technology(database, id, assign: technology) {
        Ok(data) ->
          technology.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `POST /api/startup/:id/expertise`
///
/// Assign an Expertise to a Startup.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **400** If the ID or the expertise ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If Startup or Expertise is not found.
/// - **409** If Expertise is already assigned to the Startup.
///
fn assign_expertise_to_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)
  use session <- require_startup_session(request)

  let decoder = {
    use expertise <- decode.field("expertise", internal.uuid_decoder())
    decode.success(expertise)
  }

  case decode.run(body, decoder) {
    Ok(expertise) if session.id == id ->
      case startup.assign_expertise(database, id, assign: expertise) {
        Ok(data) ->
          expertise.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `POST /api/startup/:id/service`
///
/// Assign a Service to a Startup.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **400** If the ID or the service ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If Startup or Service is not found.
/// - **409** If Service is already assigned to the Startup.
///
fn assign_service_to_startup(
  request: Request,
  database: pog.Connection,
  id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use body <- wisp.require_json(request)
  use session <- require_startup_session(request)

  let decoder = {
    use service <- decode.field("service", internal.uuid_decoder())
    decode.success(service)
  }

  case decode.run(body, decoder) {
    Ok(service) if session.id == id ->
      case startup.assign_service(database, id, assign: service) {
        Ok(data) ->
          service.to_json(data)
          |> json.to_string()
          |> wisp.json_response(201)

        Error(error) -> handle_startup_error(error)
      }

    Ok(_) -> wisp.response(403)
    Error(_) -> wisp.bad_request("Invalid JSON")
  }
}

/// ## `GET /api/auth/restore`
///
/// Restore the account associated with the current session.
///
/// The signed `SESSION` cookie is decoded and used to load the corresponding
/// Startup or Company. The response body contains the account as JSON.
///
/// > **Note:** This route does **not** refresh the session token duration. Use
/// > [`refresh_session`](#refresh_session) for that.
///
/// ## Status Codes
///
/// - **200** If the session is valid and the account exists.
/// - **401** If the session cookie is missing or invalid.
/// - **404** If the Startup or Company referenced by the session is not found.
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

/// ## `GET /api/auth/refresh`
///
/// Refresh the current session token duration.
///
/// A new signed `SESSION` cookie is issued with a one-hour lifetime. The
/// response has no body.
///
/// ## Status Codes
///
/// - **204** If the cookie was refreshed.
/// - **401** If the session cookie is missing or invalid.
pub fn refresh_session(request: Request) -> Response {
  use session <- require_session(request)
  set_session_token(wisp.no_content(), request, session, duration.hours(1))
}

/// ## `POST /api/auth/logout`
///
/// Log out by expiring the session cookie.
///
/// The current session is required so the cookie can be overwritten with an
/// empty value and a zero-second lifetime. The response has no body.
///
/// ## Status Codes
///
/// - **204** If the cookie was expired.
/// - **401** If the session cookie is missing or invalid.
fn handle_logout(request: Request) -> Response {
  use session <- require_session(request)
  set_session_token(wisp.no_content(), request, session, duration.seconds(0))
}

/// ## `GET /api/startup/:id/expertise`
///
/// Fetch all Expertises assigned to a Startup.
///
/// Returns an empty list if the Startup does not exist or has no assigned
/// expertises.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
///
/// ## Response Body
///
/// ```json
/// [
///   {
///    "id": "01a058ae-057f-73e8-b2a0-50986559767b",
///    "name": "Education",
///    "description": ""
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `expertise_id` (UUID, required): the Expertise's ID.
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
/// - **400** If the ID or the expertise ID is not a valid UUID.
/// - **404** If the Expertise is not assigned to the Startup.
///
fn unassign_expertise_from_expertise(
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

/// Require a valid signed session cookie.
///
/// The `SESSION` cookie is verified and decoded with
/// [`session_decoder`](#session_decoder). On success, the decoded
/// [`Session`](#Session) is passed to `next`.
///
/// ## Status Codes
///
/// - **401** If the session cookie is missing, has an invalid signature, or
///   contains an invalid session payload.
///
/// ## Examples
///
/// ```gleam
/// pub fn handle_request(request: Request) -> Response {
///   use session <- require_session(request)
///
///   case session {
///     Startup(id:) -> handle_startup_session(request, id)
///     Company(id:) -> handle_company_session(request, id)
///   }
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
/// Fetch all Services assigned to a Startup.
///
/// Returns an empty list if the Startup does not exist or has no assigned
/// services.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **400** If the ID is not a valid UUID.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `service_id` (UUID, required): the Service's ID.
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
/// - **400** If the ID or the service ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If the Service is not assigned to the Startup.
///
fn unassign_service_from_startup(
  request: Request,
  database: pog.Connection,
  id: String,
  service_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use service <- require_valid_uuid(service_id)
  use session <- require_startup_session(request)

  case startup.unassign_service(database, id, unassign: service) {
    Ok(data) if session.id == id ->
      service.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Ok(_) -> wisp.response(403)
    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/:id/segment`
///
/// Fetch all Segments assigned to a Startup.
///
/// Returns an empty list if the Startup does not exist or has no assigned
/// segments.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **400** If the ID is not a valid UUID.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `segment_id` (UUID, required): the Segment's ID.
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
/// - **400** If the ID or the segment ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If the Segment is not assigned to the Startup.
///
fn unassign_segment_from_startup(
  request: Request,
  database: pog.Connection,
  id: String,
  segment_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use segment <- require_valid_uuid(segment_id)
  use session <- require_startup_session(request)

  case startup.unassign_segment(database, id, unassign: segment) {
    Ok(data) if session.id == id ->
      segment.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Ok(_) -> wisp.response(403)
    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup/:id/technology`
///
/// Fetch all Technologies assigned to a Startup.
///
/// Returns an empty list if the Startup does not exist or has no assigned
/// technologies.
///
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
/// - `technology_id` (UUID, required): the Technology's ID.
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
/// - **400** If the ID or the technology ID is not a valid UUID.
/// - **401** If not authenticated.
/// - **403** If the session is not authorized for this Startup.
/// - **404** If the Technology is not assigned to the Startup.
///
fn unassign_technology_from_startup(
  request: Request,
  database: pog.Connection,
  id: String,
  technology_id: String,
) -> Response {
  use id <- require_valid_uuid(id)
  use technology <- require_valid_uuid(technology_id)
  use session <- require_startup_session(request)

  case startup.unassign_technology(database, id, unassign: technology) {
    Ok(data) if session.id == id ->
      technology.to_json(data)
      |> json.to_string()
      |> wisp.json_response(200)

    Ok(_) -> wisp.response(403)
    Error(error) -> handle_startup_error(error)
  }
}

/// ## `GET /api/startup`
///
/// Fetch a paginated list of registered Startups.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Startups to return.
/// - `offset` (Int, required): the number of Startups to skip.
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
/// - **200** If successful.
/// - **400** If the query is missing, invalid or incomplete.
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

/// Convert a [`WebError`](#WebError) into an HTTP response.
fn handle_error(error: WebError) -> Response {
  case error {
    StartupError(error) -> handle_startup_error(error)
    SegmentError(error) -> handle_segment_error(error)
    TechnologyError(error) -> handle_technology_error(error)
    ExpertiseError(error) -> handle_expertise_error(error)
    ServiceError(error) -> handle_service_error(error)
    DemandError(error) -> handle_demand_error(error)
    MissingQuery -> wisp.bad_request("Missing query")
    InvalidQueryParameter(key) -> wisp.bad_request("Invalid query: " <> key)
    CompanyError(error) -> handle_company_error(error)

    PolicyVersionMismatch(expected:, got:) ->
      {
        "Policy version mismatch, expected: "
        <> int.to_string(expected)
        <> " got: "
        <> int.to_string(got)
      }
      |> wisp.bad_request
  }
}

/// Convert a Segment error into an HTTP response.
fn handle_segment_error(error: segment.SegmentError) -> Response {
  case error {
    segment.DatabaseError(error:) -> handle_database_error(error)
    segment.FailedToRegisterSegment -> wisp.internal_server_error()
    segment.NotFound(_) -> wisp.not_found()
  }
}

/// Convert a Technology error into an HTTP response.
fn handle_technology_error(error: technology.TechnologyError) -> Response {
  case error {
    technology.DatabaseError(error:) -> handle_database_error(error)
    technology.FailedToRegisterTechnology -> wisp.internal_server_error()
    technology.NotFound(_) -> wisp.not_found()
  }
}

/// Convert an Expertise error into an HTTP response.
fn handle_expertise_error(error: expertise.ExpertiseError) -> Response {
  case error {
    expertise.DatabaseError(error) -> handle_database_error(error)
    expertise.FailedToRegisterExpertise -> wisp.internal_server_error()
    expertise.NotFound(_) -> wisp.not_found()
  }
}

/// Convert a Service error into an HTTP response.
fn handle_service_error(error: service.ServiceError) -> Response {
  case error {
    service.DatabaseError(error:) -> handle_database_error(error)
    service.FailedToRegisterService -> wisp.internal_server_error()
    service.NotFound(_) -> wisp.not_found()
  }
}

/// ## `GET /api/segment`
///
/// Fetch a paginated list of registered Segments.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Segments to return.
/// - `offset` (Int, required): the number of Segments to skip.
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
/// - **200** If successful.
/// - **400** If the query is missing, invalid or incomplete.
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
/// Fetch a paginated list of registered Technologies.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Technologies to return.
/// - `offset` (Int, required): the number of Technologies to skip.
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
/// - **200** If successful.
/// - **400** If the query is missing, invalid or incomplete.
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
/// Fetch a paginated list of registered Expertises.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Expertises to return.
/// - `offset` (Int, required): the number of Expertises to skip.
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
/// - **200** If successful.
/// - **400** If the query is missing, invalid or incomplete.
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
/// Fetch a paginated list of registered Services.
///
/// ## Query Parameters
///
/// - `limit` (Int, required): the maximum number of Services to return.
/// - `offset` (Int, required): the number of Services to skip.
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
/// - **200** If successful.
/// - **400** If the query is missing, invalid or incomplete.
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

/// ## `GET /`
///
/// Send the necessary HTML for the client-side application. The user will
/// use it to communicate with the Server.
///
/// ## Status Codes
///
/// - **200** If successful.
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

/// Apply the common HTTP middleware stack to a request.
///
/// If none of the middleware short-circuits the request, `next` is called with
/// the transformed request.
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

/// Validate that `id` is a UUID before continuing.
///
/// If the value is a valid UUID, it is passed to `next` as a
/// [`uuid.Uuid`](https://hexdocs.pm/youid/youid_uuid.html#Uuid). Otherwise the
/// request is rejected with `400 Bad Request` and a message containing the
/// invalid value.
///
/// ## Status Codes
///
/// - **400** If `id` is not a valid UUID.
///
/// ## Examples
///
/// ```gleam
/// pub fn handle_request(database: pog.Connection, id: String) -> Response {
///   use id <- require_valid_uuid(id)
///
///   case startup.get(database, id) {
///     Ok(data) -> wisp.ok()
///     Error(error) -> handle_startup_error(error)
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
/// ## Path Parameters
///
/// - `id` (UUID, required): the Startup's ID.
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
/// - **200** If successful.
/// - **400** If the ID is not a valid UUID.
/// - **404** If the Startup is not found.
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

/// Convert a Startup error into an HTTP response.
fn handle_startup_error(error: startup.StartupError) -> Response {
  case error {
    startup.DatabaseError(error) -> handle_database_error(error)

    startup.LgpdError(error) -> handle_lgpd_error(error)

    startup.FailedToRegisterStartup -> wisp.internal_server_error()

    startup.FailedToUpdateStartup(id) ->
      { "Failed to update Startup: " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.internal_server_error(), _)

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

/// Convert a database error into an HTTP response.
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

/// An authenticated account session.
///
/// A session identifies whether the logged-in account is a Startup or a
/// Company and stores its ID. It is persisted as JSON in the signed `SESSION`
/// cookie.
pub type Session {
  /// An authenticated Startup.
  Startup(id: uuid.Uuid)
  /// An authenticated Company.
  Company(id: uuid.Uuid)
}

/// Encode a [`Session`](#Session) as JSON.
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

/// Decode a JSON [`Session`](#Session) value.
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

/// Name of the signed cookie that stores the user's [`Session`](#Session).
pub const session_cookie = "SESSION"

/// ## `POST /api/auth/login`
///
/// Authenticate a Startup or a Company.
///
/// On success, a signed [`session_cookie`](#session_cookie) is set on the
/// response and lasts for one hour. The response body contains the
/// authenticated Startup or Company as JSON.
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
/// - `session`: either `"startup"` or `"company"`.
///
/// ## Response Body
///
/// The authenticated Startup or Company object. See
/// [`get_startup_by_id`](#get_startup_by_id) and
/// [`get_company_by_id`](#get_company_by_id) for example payloads.
///
/// ## Status Codes
///
/// - **200** If the credentials are valid.
/// - **400** If the request body is invalid JSON, the email has an invalid
///   format, or the session type is invalid.
/// - **401** If the email or password is incorrect.
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
    // startup session
    Ok(payload.Login(session: "startup", email:, password:)) ->
      case startup.verify(database, email:, password:) {
        Error(error) -> handle_startup_error(error)
        Ok(startup) ->
          startup.to_json(startup)
          |> json.to_string
          |> wisp.json_response(200)
          |> set_session_token(request, Startup(startup.id), duration)
      }

    // company session
    Ok(payload.Login(session: "company", email:, password:)) ->
      case company.verify(database, email:, password:) {
        Error(error) -> handle_company_error(error)
        Ok(company) ->
          company.to_json(company)
          |> json.to_string
          |> wisp.json_response(200)
          |> set_session_token(request, Company(company.id), duration)
      }

    // correct json but invalid session type
    Ok(payload.Login(session:, ..)) ->
      wisp.bad_request("Invalid session type: " <> session)

    // incorrect json
    Error(_) -> wisp.bad_request("Invalid JSON format")
  }
}

/// Attach a signed session cookie to a response.
///
/// The [`Session`](#Session) is encoded as JSON, signed, and stored in the
/// [`session_cookie`](#session_cookie) cookie. `duration` controls the cookie's
/// `Max-Age`; pass `duration.seconds(0)` to expire it during logout.
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
/// Register a new Startup.
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
/// - `stage`: either `"traction"` or `"scaling"`.
///
/// ## Response Body
///
/// The created Startup. See [`get_startup_by_id`](#get_startup_by_id) for an
/// example payload.
///
/// ## Status Codes
///
/// - **201** If the Startup was created.
/// - **400** If the request body is invalid JSON, or a field has an invalid
///   value.
/// - **409** If the email or CNPJ is already registered.
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
/// Register a new Company.
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
/// - `size`: one of `"micro"`, `"small"`, `"medium"` or `"big"`.
///
/// ## Response Body
///
/// The created Company. See [`get_company_by_id`](#get_company_by_id) for an
/// example payload.
///
/// ## Status Codes
///
/// - **201** If the Company was created.
/// - **400** If the request body is invalid JSON, or a field has an invalid
///   value.
/// - **409** If the email or CNPJ is already registered.
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

/// Convert a Demand error into an HTTP response.
///
/// Database or assignment failures become `500`, missing demands, companies
/// and entities become `404`, and duplicate assignments become `409`.
fn handle_demand_error(error: demand.DemandError) -> Response {
  case error {
    demand.DatabaseError(error) -> handle_database_error(error)

    demand.FailedToRegisterDemand -> wisp.internal_server_error()

    demand.NotFound(id) ->
      { "Demand " <> uuid.to_string(id) <> " not found" }
      |> wisp.string_body(wisp.not_found(), _)

    demand.CompanyNotFound(id) ->
      { "Company " <> uuid.to_string(id) <> " not found" }
      |> wisp.string_body(wisp.not_found(), _)

    demand.AssignmentFailure(id) ->
      { "Failed to assign " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.internal_server_error(), _)

    demand.AssignmentConflict(id) ->
      { uuid.to_string(id) <> " is already assigned" }
      |> wisp.string_body(wisp.response(409), _)

    demand.AssignmentNotFound(id) ->
      { "Entity " <> uuid.to_string(id) <> " is not assigned to the Demand" }
      |> wisp.string_body(wisp.not_found(), _)

    demand.AssignedMissingEntity(id) ->
      { "Entity " <> uuid.to_string(id) <> " was not found" }
      |> wisp.string_body(wisp.not_found(), _)
  }
}

/// Convert a Company error into an HTTP response.
fn handle_company_error(error: company.CompanyError) -> Response {
  case error {
    company.DatabaseError(error) -> handle_database_error(error)

    company.InvalidEmail(value) -> wisp.bad_request("Invalid email: " <> value)

    company.HashError(_) -> wisp.internal_server_error()

    company.LgpdError(error) -> handle_lgpd_error(error)

    company.NotFound(id) ->
      { "Company not found: " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.not_found(), _)

    company.InvalidCnpj(value) -> wisp.bad_request("Invalid CNPJ: " <> value)

    company.InvalidWebsite(value) ->
      wisp.bad_request("Invalid website: " <> value)

    company.EmailNotFound(_) | company.WrongPassword ->
      { "Wrong email or password" }
      |> wisp.string_body(wisp.response(401), _)

    company.CnpjConflict(value) ->
      { "CNPJ already registered: " <> cnpj.to_string(value) }
      |> wisp.string_body(wisp.response(409), _)

    company.EmailConflict(value) ->
      { "Email already registered: " <> email.to_string(value) }
      |> wisp.string_body(wisp.response(409), _)

    company.FailedToRegisterCompany ->
      "Failed to register Company"
      |> wisp.string_body(wisp.internal_server_error(), _)

    company.FailedToUpdateCompany(_) ->
      "Failed to update Company"
      |> wisp.string_body(wisp.internal_server_error(), _)

    company.StartupNotFound(id) ->
      { "Startup not found: " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.not_found(), _)

    company.BookmarkConflict(id) ->
      { "Startup already bookmarked: " <> uuid.to_string(id) }
      |> wisp.string_body(wisp.response(409), _)

    company.FailedToBookmarkStartup(_) ->
      "Failed to bookmark Startup"
      |> wisp.string_body(wisp.internal_server_error(), _)

    company.BookmarkNotFound ->
      "Bookmark not found"
      |> wisp.string_body(wisp.not_found(), _)
  }
}

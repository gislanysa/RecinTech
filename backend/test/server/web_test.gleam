import gleam/dynamic/decode
import gleam/http
import gleam/http/request
import gleam/http/response
import gleam/int
import gleam/json
import gleam/list
import server/cnpj
import server/company
import server/dummy
import server/email
import server/startup
import server/startup/expertise
import server/startup/segment
import server/startup/service
import server/startup/technology
import server/web
import server_test
import wisp.{type Response}
import wisp/simulate
import youid/uuid

/// Panics if the Response body is valid JSON
///
/// ## Examples
///
/// ```gleam
/// let response = web.handle_request(request, context)
/// expect_json(response)
/// ```
///
fn expect_json(response: Response) -> Nil {
  let content_type = response.get_header(response, "content-type")
  assert content_type == Ok("application/json; charset=utf-8")

  Nil
}

pub fn html_document_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/")
    |> web.handle_request(context)

  assert response.status == 200
  let content_type = list.key_find(response.headers, "content-type")
  assert content_type == Ok("text/html; charset=utf-8")

  Nil
}

pub fn not_found_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/wibble")
    |> web.handle_request(context)

  assert response.status == 404
}

pub fn healthcheck_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/healthcheck")
    |> web.handle_request(context)

  assert response.status == 200
}

pub fn get_startup_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let id = uuid.to_string(startup.id)

  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(found) = json.parse(body, startup.decoder())

  assert startup == found as "return correct startup"

  Nil
}

/// Querying a missing Startup should return 404 Not Found
pub fn get_missing_startup_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7_string()
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

/// Path paramether needs to be a valid UUID V7
pub fn get_startup_by_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    //                                                     vvvvvv
    simulate.browser_request(http.Get, "/api/startup/" <> "wibble")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn handle_login_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)

  let body =
    json.object([
      #("session", json.string("startup")),
      #("email", json.string(email.to_string(startup.email))),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let assert Ok(cookie) =
    response.get_cookies(response)
    |> list.key_find(web.session_cookie)

  assert cookie != ""

  // response must contain startup data
  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, startup.decoder())

  // return correct startup
  assert returned.id == startup.id

  Nil
}

pub fn handle_login_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)

  let body =
    json.object([
      #("session", json.string("company")),
      #("email", json.string(email.to_string(company.email))),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let assert Ok(cookie) =
    response.get_cookies(response)
    |> list.key_find(web.session_cookie)

  assert cookie != ""

  // response must contain startup data
  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, company.decoder())

  // return correct company
  assert returned.id == company.id

  Nil
}

pub fn handle_login_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("session", json.string("startup")),
      #("email", json.string("user@email.com")),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  // We return 401 instead of 404, because we dont want an attacker to know that
  // an email is registered in the database.
  assert response.status == 401

  Nil
}

pub fn get_startup_segments_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let startup = dummy.new_startup(context.database)

  // First segment
  let segment_a = dummy.new_segment(context.database)

  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment_a.id)

  // Second segment
  let segment_b = dummy.new_segment(context.database)

  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment_b.id)

  // request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/segment")
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(segment.decoder()))
  assert returned == [segment_a, segment_b]

  Nil
}

pub fn get_startup_services_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let startup = dummy.new_startup(context.database)

  // First service
  let service_a = dummy.new_service(context.database)
  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, assign: service_a.id)

  // Second service
  let service_b = dummy.new_service(context.database)
  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, assign: service_b.id)

  // request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/service")
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(service.decoder()))
  assert returned == [service_a, service_b]

  Nil
}

pub fn get_startup_technologies_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let startup = dummy.new_startup(context.database)

  // First technology
  let technology_a = dummy.new_technology(context.database)

  let assert Ok(_) =
    startup.assign_technology(
      context.database,
      startup.id,
      assign: technology_a.id,
    )

  // Second technology
  let technology_b = dummy.new_technology(context.database)

  let assert Ok(_) =
    startup.assign_technology(
      context.database,
      startup.id,
      assign: technology_b.id,
    )

  // request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/technology")
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(technology.decoder()))
  assert returned == [technology_a, technology_b]

  Nil
}

pub fn get_startup_expertises_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let startup = dummy.new_startup(context.database)

  // First expertise
  let expertise_a = dummy.new_expertise(context.database)

  let assert Ok(_) =
    startup.assign_expertise(
      context.database,
      startup.id,
      assign: expertise_a.id,
    )

  // Second expertise
  let expertise_b = dummy.new_expertise(context.database)

  let assert Ok(_) =
    startup.assign_expertise(
      context.database,
      startup.id,
      assign: expertise_b.id,
    )

  // request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/expertise")
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(expertise.decoder()))
  assert returned == [expertise_a, expertise_b]

  Nil
}

pub fn get_many_startups_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let startups = dummy.many(max, fn() { dummy.new_startup(context.database) })

  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(startup.decoder()))

  assert returned == startups

  Nil
}

pub fn get_many_startups_missing_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_startups_invalid_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("limit", "wibble"), #("offset", "0")])
    //                                ^^
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_startups_incomplete_query_test() -> Nil {
  use context <- server_test.with_context()

  // No offset
  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("limit", "1")])
    |> web.handle_request(context)
  assert response.status == 400

  // Missing "limit" query
  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("offset", "0")])
    |> web.handle_request(context)
  assert response.status == 400

  Nil
}

pub fn require_session_test() -> Nil {
  use context <- server_test.with_context()
  let startup = dummy.new_startup(context.database)

  let handle_request = fn(request) {
    let request =
      dummy.with_session(
        request,
        context,
        web.Startup(startup.id),
        startup.email,
      )

    use _ <- web.require_session(request)
    wisp.ok()
  }

  let request = simulate.browser_request(http.Get, "/")
  let response = handle_request(request)
  assert response.status == 200

  Nil
}

pub fn require_session_missing_token_test() -> Nil {
  let handle_request = fn(request) {
    use _ <- web.require_session(request)
    wisp.ok()
  }

  let request = simulate.request(http.Get, "/")
  let response = handle_request(request)
  assert response.status == 401

  Nil
}

pub fn restore_session_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let request = simulate.browser_request(http.Get, "/api/auth/restore")
  let response =
    dummy.with_session(request, context, web.Startup(startup.id), startup.email)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, startup.decoder())

  assert returned == startup

  Nil
}

pub fn restore_session_missing_token_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/auth/restore")
    |> web.handle_request(context)

  assert response.status == 401

  Nil
}

pub fn register_startup_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("name", json.string("critic level")),
      #("email", json.string("user@email.com")),
      #("password", json.string("wibble")),
      #("cnpj", json.string("12345678901234")),
      #("stage", json.string("traction")),
      #("description", json.string("muito legal")),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("https://criticlevel.dev")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(_) = json.parse(body, startup.decoder())

  Nil
}

pub fn register_startup_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let body =
    json.object([
      #("name", json.string("critic level")),
      #("email", json.string(email.to_string(startup.email))),
      #("password", json.string("wibble")),
      #("cnpj", json.string("12345678901234")),
      #("stage", json.string("traction")),
      #("description", json.string("muito legal")),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("https://criticlevel.dev")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn register_startup_cnpj_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let body =
    json.object([
      #("name", json.string("critic level")),
      #("email", json.string("user@email.com")),
      #("password", json.string("wibble")),
      #("cnpj", json.string(cnpj.to_string(startup.cnpj))),
      #("stage", json.string("traction")),
      #("description", json.string("muito legal")),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("https://criticlevel.dev")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn refresh_session_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let request = simulate.browser_request(http.Get, "/api/auth/refresh")

  let response =
    dummy.with_session(request, context, web.Company(company.id), company.email)
    |> web.handle_request(context)

  assert response.status == 204

  let assert Ok(_) =
    response.get_cookies(response)
    |> list.key_find(web.session_cookie)

  Nil
}

pub fn refresh_session_missing_token_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/auth/refresh")
    |> web.handle_request(context)

  // Missing token
  assert response.status == 401

  Nil
}

pub fn assign_startup_to_segment_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  let body =
    json.object([
      #("segment", json.string(uuid.to_string(segment.id))),
    ])

  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/segment"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, segment.decoder())
  assert returned.id == segment.id

  Nil
}

pub fn assign_startup_to_segment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  // assigning once
  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, segment.id)

  let body =
    json.object([
      #("segment", json.string(uuid.to_string(segment.id))),
    ])

  // assigning twice
  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/segment"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn assign_startup_to_technology_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let techology = dummy.new_technology(context.database)

  let body =
    json.object([
      #("technology", json.string(uuid.to_string(techology.id))),
    ])

  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/technology"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, technology.decoder())
  assert returned.id == techology.id

  Nil
}

pub fn assign_startup_to_technology_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let technology = dummy.new_technology(context.database)

  // assigning once
  let assert Ok(_) =
    startup.assign_technology(context.database, startup.id, technology.id)

  let body =
    json.object([
      #("technology", json.string(uuid.to_string(technology.id))),
    ])

  // assigning twice
  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/technology"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn assign_startup_to_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  let body =
    json.object([
      #("expertise", json.string(uuid.to_string(expertise.id))),
    ])

  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/expertise"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, expertise.decoder())
  assert returned == expertise

  Nil
}

pub fn assign_startup_to_expertise_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  // assigning once
  let assert Ok(_) =
    startup.assign_expertise(context.database, startup.id, expertise.id)

  let body =
    json.object([
      #("expertise", json.string(uuid.to_string(expertise.id))),
    ])

  // assigning twice
  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/expertise"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn assign_startup_to_service_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let service = dummy.new_service(context.database)

  let body =
    json.object([
      #("service", json.string(uuid.to_string(service.id))),
    ])

  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/service"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, service.decoder())
  assert returned.id == service.id

  Nil
}

pub fn assign_startup_to_service_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let service = dummy.new_service(context.database)

  // assigning once
  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, service.id)

  let body =
    json.object([
      #("service", json.string(uuid.to_string(service.id))),
    ])

  // assigning twice
  let endpoint = "/api/startup/" <> uuid.to_string(startup.id) <> "/service"
  let response =
    simulate.browser_request(http.Post, endpoint)
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn unassign_startup_from_segment_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment.id)

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/segment/"
    <> uuid.to_string(segment.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, segment.decoder())
  assert returned.id == segment.id

  // It should no longer be assigned
  let assert Ok([]) = startup.get_segments(context.database, startup.id)

  Nil
}

pub fn unassign_missing_segment_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/segment/"
    <> uuid.to_string(missing_id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn unassign_segment_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  // Invalid startup ID
  let endpoint = "/api/startup/wibble/segment/" <> uuid.to_string(segment.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  // Invalid segment ID
  let endpoint =
    "/api/startup/" <> uuid.to_string(startup.id) <> "/segment/wibble"

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn unassign_startup_from_service_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let service = dummy.new_service(context.database)

  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, assign: service.id)

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/service/"
    <> uuid.to_string(service.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, service.decoder())

  assert returned.id == service.id
  let assert Ok([]) = startup.get_services(context.database, startup.id)

  Nil
}

pub fn unassign_missing_service_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/service/"
    <> uuid.to_string(missing_id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn unassign_service_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let service = dummy.new_service(context.database)

  // invalid startup id
  let endpoint = "/api/startup/wibble/service/" <> uuid.to_string(service.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  // invalid service id
  let endpoint =
    "/api/startup/" <> uuid.to_string(startup.id) <> "/service/wibble"

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn unassign_startup_from_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(_) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/expertise/"
    <> uuid.to_string(expertise.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, expertise.decoder())

  assert returned.id == expertise.id
  let assert Ok([]) = startup.get_expertises(context.database, startup.id)

  Nil
}

pub fn unassign_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/expertise/"
    <> uuid.to_string(missing_id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn unassign_expertise_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  // invalid startup id
  let endpoint =
    "/api/startup/wibble/expertise/" <> uuid.to_string(expertise.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  // invalid expertise id
  let endpoint =
    "/api/startup/" <> uuid.to_string(startup.id) <> "/expertise/wibble"

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn unassign_startup_from_technology_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let technology = dummy.new_technology(context.database)

  let assert Ok(_) =
    startup.assign_technology(
      context.database,
      startup.id,
      assign: technology.id,
    )

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/technology/"
    <> uuid.to_string(technology.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, technology.decoder())

  assert returned == technology
  let assert Ok([]) = startup.get_technologies(context.database, startup.id)

  Nil
}

pub fn unassign_missing_technology_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let endpoint =
    "/api/startup/"
    <> uuid.to_string(startup.id)
    <> "/technology/"
    <> uuid.to_string(missing_id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn unassign_technology_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let technology = dummy.new_technology(context.database)

  // invalid startup id
  let endpoint =
    "/api/startup/wibble/technology/" <> uuid.to_string(technology.id)

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  // invalid technology id
  let endpoint =
    "/api/startup/" <> uuid.to_string(startup.id) <> "/technology/wibble"

  let response =
    simulate.browser_request(http.Delete, endpoint)
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_segments_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let segments = dummy.many(max, fn() { dummy.new_segment(context.database) })

  let response =
    simulate.browser_request(http.Get, "/api/segment")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(segment.decoder()))
  assert returned == segments

  Nil
}

pub fn get_many_technologies_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let technologies =
    dummy.many(max, fn() { dummy.new_technology(context.database) })

  let response =
    simulate.browser_request(http.Get, "/api/technology")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(technology.decoder()))
  assert returned == technologies

  Nil
}

pub fn get_many_technologies_missing_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/technology")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_technologies_invalid_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/technology")
    |> request.set_query([#("limit", "wibble"), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_expertises_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let expertises =
    dummy.many(max, fn() { dummy.new_expertise(context.database) })

  let response =
    simulate.browser_request(http.Get, "/api/expertise")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(expertise.decoder()))
  assert returned == expertises

  Nil
}

pub fn get_many_expertises_missing_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/expertise")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_expertises_invalid_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/expertise")
    |> request.set_query([#("limit", "wibble"), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_services_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let services = dummy.many(max, fn() { dummy.new_service(context.database) })

  let response =
    simulate.browser_request(http.Get, "/api/service")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(service.decoder()))
  assert returned == services

  Nil
}

pub fn get_many_services_missing_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/service")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_many_services_invalid_query_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/service")
    |> request.set_query([#("limit", "wibble"), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_technology_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let technology = dummy.new_technology(context.database)
  let endpoint = "/api/technology/" <> uuid.to_string(technology.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, technology.decoder())
  assert returned.id == technology.id

  Nil
}

pub fn get_missing_technology_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let endpoint = "/api/technology/" <> uuid.v7_string()

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn get_technology_by_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/technology/wibble")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_expertise_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let expertise = dummy.new_expertise(context.database)
  let endpoint = "/api/expertise/" <> uuid.to_string(expertise.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, expertise.decoder())
  assert returned.id == expertise.id

  Nil
}

pub fn get_missing_expertise_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let endpoint = "/api/expertise/" <> uuid.v7_string()

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn get_expertise_by_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/expertise/wibble")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_service_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let service = dummy.new_service(context.database)
  let endpoint = "/api/service/" <> uuid.to_string(service.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, service.decoder())
  assert returned.id == service.id

  Nil
}

pub fn get_missing_service_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let endpoint = "/api/service/" <> uuid.v7_string()

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn get_service_by_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/service/wibble")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn register_company_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("name", json.string("wibble")),
      #("size", company.size_to_json(company.Big)),
      #("email", json.string("wibble@email.com")),
      #("password", json.string("wibble")),
      #("cnpj", json.string("12345678901234")),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/company")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(_) = json.parse(body, company.decoder())

  Nil
}

pub fn register_company_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let body =
    json.object([
      #("name", json.string("wibble")),
      #("size", company.size_to_json(company.Micro)),
      #("email", email.to_json(company.email)),
      #("password", json.string("wibble")),
      #("cnpj", json.string("00000000000000")),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/company")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn register_company_cnpj_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let body =
    json.object([
      #("name", json.string("wibble")),
      #("size", company.size_to_json(company.Micro)),
      #("email", json.string("wobble@email.com")),
      #("password", json.string("wibble")),
      #("cnpj", cnpj.to_json(company.cnpj)),
      #("city", json.string("Recife")),
      #("state", json.string("PE")),
      #("website", json.string("")),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/company")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn get_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let endpoint = "/api/company/" <> uuid.to_string(company.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, company.decoder())
  assert returned.id == company.id

  Nil
}

pub fn get_missing_company_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7_string()
  let endpoint = "/api/company/" <> id

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

pub fn logout_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let response =
    simulate.browser_request(http.Post, "/api/auth/logout")
    |> dummy.with_session(context, web.Company(company.id), company.email)
    |> web.handle_request(context)

  assert response.status == 204

  Nil
}

pub fn logout_missing_session_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Post, "/api/auth/logout")
    |> web.handle_request(context)

  assert response.status == 401

  Nil
}

pub fn get_segment_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let segment = dummy.new_segment(context.database)
  let endpoint = "/api/segment/" <> uuid.to_string(segment.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  expect_json(response)

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, segment.decoder())
  assert returned.id == segment.id

  Nil
}

pub fn get_missing_segment_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let endpoint = "/api/segment/" <> uuid.to_string(missing_id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

import gleam/dynamic/decode
import gleam/http
import gleam/http/request
import gleam/http/response
import gleam/json
import gleam/list
import server/dummy
import server/email
import server/segment
import server/startup
import server/startup/expertise
import server/startup/service
import server/startup/technology
import server/web
import server_test
import wisp
import wisp/simulate
import youid/uuid

pub fn html_document_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/")
    |> web.handle_request(context)

  assert response.status == 200
  assert list.key_find(response.headers, "content-type")
    == Ok("text/html; charset=utf-8")

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
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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
      #("email", json.string(email.to_string(startup.email))),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login/startup")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let assert Ok(_) =
    response.get_cookies(response)
    |> list.key_find(web.session_cookie)

  // response must contain startup data
  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, startup.decoder())

  // return correct startup
  assert returned.id == startup.id
  assert returned.name == startup.name
  assert returned.email == startup.email

  Nil
}

pub fn handle_login_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("email", json.string("user@email.com")),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login/startup")
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

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/segment/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/service/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/technology/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/expertise/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(expertise.decoder()))
  assert returned == [expertise_a, expertise_b]

  Nil
}

pub fn get_many_startups_test() -> Nil {
  use context <- server_test.with_context()

  // Three startups
  let _startup_a = dummy.new_startup(context.database)
  let startup_b = dummy.new_startup(context.database)
  let startup_c = dummy.new_startup(context.database)

  // This will only return B and C
  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("limit", "2"), #("offset", "1")])
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(startup.decoder()))

  assert returned == [startup_b, startup_c]

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
    let request = dummy.with_startup_session(startup, request, context)
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
    dummy.with_startup_session(startup, request, context)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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

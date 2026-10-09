import gleam/dynamic/decode
import gleam/http
import gleam/http/request
import gleam/http/response
import gleam/int
import gleam/json
import gleam/list
import server/cnpj
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
      #("session", json.string("startup")),
      #("email", json.string(email.to_string(startup.email))),
      #("password", json.string(dummy.password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login")
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

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/segment")
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
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/service")
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
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/technology")
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
    simulate.browser_request(http.Get, "/api/startup/" <> id <> "/expertise")
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
  let max = 6

  // Three startups
  let startups =
    int.range(from: 1, to: max, with: [], run: fn(acc, _) {
      let segment = dummy.new_startup(context.database)
      [segment, ..acc]
    })
    |> list.reverse

  // This will only return B and C
  let response =
    simulate.browser_request(http.Get, "/api/startup")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

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

pub fn register_startup_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("name", json.string("critic level")),
      #("email", json.string("user@email.com")),
      #("password", json.string("wibble")),
      #("cnpj", json.string("12345678901234")),
      #("stage", json.string("seed")),
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
      #("stage", json.string("seed")),
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
      #("stage", json.string("seed")),
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

  let request = simulate.browser_request(http.Get, "/api/auth/refresh")

  let response =
    dummy.new_startup(context.database)
    |> dummy.with_startup_session(request, context)
    |> web.handle_request(context)

  assert response.status == 200

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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("segment", json.string(uuid.to_string(segment.id))),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup/segment")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, segment.decoder())
  assert returned == segment

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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("segment", json.string(uuid.to_string(segment.id))),
    ])

  // assigning twice
  let response =
    simulate.browser_request(http.Post, "/api/startup/segment")
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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("technology", json.string(uuid.to_string(techology.id))),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup/technology")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, technology.decoder())
  assert returned == techology

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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("technology", json.string(uuid.to_string(technology.id))),
    ])

  // assigning twice
  let response =
    simulate.browser_request(http.Post, "/api/startup/technology")
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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("expertise", json.string(uuid.to_string(expertise.id))),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup/expertise")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("expertise", json.string(uuid.to_string(expertise.id))),
    ])

  // assigning twice
  let response =
    simulate.browser_request(http.Post, "/api/startup/expertise")
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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("service", json.string(uuid.to_string(service.id))),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/startup/service")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 201
  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, service.decoder())
  assert returned == service

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
      #("startup", json.string(uuid.to_string(startup.id))),
      #("service", json.string(uuid.to_string(service.id))),
    ])

  // assigning twice
  let response =
    simulate.browser_request(http.Post, "/api/startup/service")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 409

  Nil
}

pub fn get_many_segments_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let segments =
    int.range(from: 1, to: max, with: [], run: fn(acc, _) {
      let segment = dummy.new_segment(context.database)
      [segment, ..acc]
    })
    |> list.reverse

  let response =
    simulate.browser_request(http.Get, "/api/segment")
    |> request.set_query([#("limit", int.to_string(max)), #("offset", "0")])
    |> web.handle_request(context)

  assert response.status == 200
  let body = simulate.read_body(response)

  let assert Ok(returned) = json.parse(body, decode.list(segment.decoder()))
  assert returned == segments

  Nil
}

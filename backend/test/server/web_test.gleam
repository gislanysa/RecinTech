import gleam/dynamic/decode
import gleam/http
import gleam/http/response
import gleam/json
import gleam/list
import server/cnpj
import server/email
import server/segment
import server/startup
import server/startup/service
import server/user
import server/web
import server_test
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

pub fn get_user_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")

  let assert Ok(user) =
    user.register(
      context.database,
      full_name: "wibble",
      email: email,
      password: "12345678",
    )

  let endpoint = "/api/user/" <> uuid.to_string(user.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> web.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let body = simulate.read_body(response)
  let assert Ok(found) = json.parse(body, user.decoder())

  assert user == found as "return correct user"

  Nil
}

/// Querying a missing User should return 404 Not Found
pub fn get_missing_user_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let user_id = uuid.v7_string()

  let response =
    simulate.browser_request(http.Get, "/api/user/" <> user_id)
    |> web.handle_request(context)

  assert response.status == 404

  Nil
}

/// Path paramether needs to be a valid UUID V7
pub fn get_user_by_invalid_id_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    //                                                  vvvvvv
    simulate.browser_request(http.Get, "/api/user/" <> "wibble")
    |> web.handle_request(context)

  assert response.status == 400

  Nil
}

pub fn get_startup_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Critic Level",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "startup muito maneira",
      city: "Recife",
      state: "Pernambuco",
    )

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

pub fn handle_login_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("wibble@email.com")
  let password = "12345678"
  let assert Ok(user) =
    user.register(context.database, full_name: "wibble", email:, password:)

  let body =
    json.object([
      #("email", json.string(email.to_string(user.email))),
      #("password", json.string(password)),
    ])

  let response =
    simulate.browser_request(http.Post, "/api/auth/login")
    |> simulate.json_body(body)
    |> web.handle_request(context)

  assert response.status == 200
  let assert Ok(_) =
    response.get_cookies(response)
    |> list.key_find(web.session_cookie)

  Nil
}

pub fn handle_login_missing_user_test() -> Nil {
  use context <- server_test.with_context()

  let body =
    json.object([
      #("email", json.string("user@email.com")),
      #("password", json.string("wibble123")),
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
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Critic Level",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "startup muito maneira",
      city: "Recife",
      state: "Pernambuco",
    )

  // First segment
  let assert Ok(segment_a) =
    segment.register(context.database, name: "health", description: "")

  let assert Ok(_) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: segment_a.id,
      as_main_segment: True,
    )

  // Second segment
  let assert Ok(segment_b) =
    segment.register(context.database, name: "iot", description: "")

  let assert Ok(_) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: segment_b.id,
      as_main_segment: True,
    )

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/segment/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(segment.decoder()))

  // Both need to be present
  assert list.contains(returned, segment_a)
  assert list.contains(returned, segment_b)

  Nil
}

pub fn get_startup_services_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Critic Level",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "startup muito maneira",
      city: "Recife",
      state: "Pernambuco",
    )

  // First service
  let assert Ok(service_a) =
    service.register(context.database, name: "web development", description: "")

  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, assign: service_a.id)

  // Second service
  let assert Ok(service_b) =
    service.register(context.database, name: "mobile", description: "")

  let assert Ok(_) =
    startup.assign_service(context.database, startup.id, assign: service_b.id)

  // Request
  let id = uuid.to_string(startup.id)
  let response =
    simulate.browser_request(http.Get, "/api/startup/service/" <> id)
    |> web.handle_request(context)

  assert response.status == 200
  let body = simulate.read_body(response)
  let assert Ok(returned) = json.parse(body, decode.list(service.decoder()))

  // Both need to be present
  assert list.contains(returned, service_a)
  assert list.contains(returned, service_b)

  Nil
}

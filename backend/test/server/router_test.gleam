import gleam/http
import gleam/http/response
import gleam/json
import gleam/list
import server/router
import server/segment
import server/startup
import server/user
import server_test
import wisp/simulate
import youid/uuid

pub fn html_document_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/")
    |> router.handle_request(context)

  assert response.status == 200
  assert list.key_find(response.headers, "content-type")
    == Ok("text/html; charset=utf-8")

  Nil
}

pub fn not_found_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Post, "/api/healthcheck")
    |> router.handle_request(context)

  assert response.status == 404
}

pub fn healthcheck_test() -> Nil {
  use context <- server_test.with_context()

  let response =
    simulate.browser_request(http.Get, "/api/healthcheck")
    |> router.handle_request(context)

  assert response.status == 200
}

pub fn get_user_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(user) =
    user.register(
      context.database,
      full_name: "wibble",
      email: "wibble@email.com",
      password: "12345678",
    )

  let endpoint = "/api/user/" <> uuid.to_string(user.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> router.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let body = simulate.read_body(response)
  let assert Ok(found) = json.parse(body, user.decoder())

  assert user == found as "return correct user"

  Nil
}

pub fn get_startup_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(segment) =
    segment.register(context.database, "gaming", "videogames are cool")

  let assert Ok(startup) =
    startup.register(
      context.database,
      segment.id,
      "Critic Level",
      "12345678901234",
      "startup muito maneira",
      "Recife",
      "Pernambuco",
    )

  let endpoint = "/api/startup/" <> uuid.to_string(startup.id)

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> router.handle_request(context)

  assert response.status == 200
  assert response.get_header(response, "content-type")
    == Ok("application/json; charset=utf-8")

  let body = simulate.read_body(response)
  let assert Ok(found) = json.parse(body, startup.decoder())

  assert startup == found as "return correct startup"

  Nil
}

pub fn get_missing_startup_by_id_test() -> Nil {
  use context <- server_test.with_context()

  let endpoint = "/api/startup/" <> uuid.to_string(uuid.v7())

  let response =
    simulate.browser_request(http.Get, endpoint)
    |> router.handle_request(context)

  assert response.status == 404

  Nil
}

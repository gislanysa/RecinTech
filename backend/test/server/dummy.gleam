//// Quickly generate Data for unit tests.

import gleam/http
import gleam/int
import gleam/json
import gleam/list
import gleam/uri
import pog
import server/cnpj
import server/company
import server/company/demand
import server/email
import server/expertise
import server/segment
import server/service
import server/startup
import server/technology
import server/web
import wisp.{type Request}
import wisp/simulate
import youid/uuid

/// Default password for all dummy entities
pub const password = "root"

pub fn new_email() -> email.Email {
  case email.parse(wisp.random_string(8) <> "@email.com") {
    Error(_) -> panic as "failed to generate dummy email"
    Ok(data) -> data
  }
}

pub fn new_cnpj() -> cnpj.Cnpj {
  case cnpj.parse(wisp.random_string(14)) {
    Error(_) -> panic as "failed to generate dummy cnpj"
    Ok(data) -> data
  }
}

pub fn new_startup(database: pog.Connection) -> startup.Startup {
  let assert Ok(stage) =
    list.shuffle([startup.Traction, startup.Scaling])
    |> list.first()

  let result =
    startup.register(
      database,
      name: "dummy_startup",
      email: new_email(),
      password:,
      stage:,
      cnpj: new_cnpj(),
      description: "useful for tests",
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  case result {
    Error(_) -> panic as "failed to generate dummy startup"
    Ok(data) -> data
  }
}

/// Send a request while including a Startup session token.
pub fn with_session(
  request: Request,
  context: web.Context,
  session: web.Session,
  email: email.Email,
) -> Request {
  let session_string = case session {
    web.Startup(_) -> "startup"
    web.Company(_) -> "company"
  }

  let login_body =
    json.object([
      #("session", json.string(session_string)),
      #("email", json.string(email.to_string(email))),
      #("password", json.string(password)),
    ])

  let login_request =
    simulate.browser_request(http.Post, "/api/auth/login")
    |> simulate.json_body(login_body)

  let login_response = web.handle_request(login_request, context)
  simulate.session(request, login_request, login_response)
}

pub fn new_segment(database: pog.Connection) -> segment.Segment {
  case segment.register(database, name: "dummy_segment", description: "") {
    Error(_) -> panic as "failed to generate dummy segment"
    Ok(data) -> data
  }
}

pub fn new_expertise(database: pog.Connection) -> expertise.Expertise {
  case expertise.register(database, name: "dummy_expertise", description: "") {
    Error(_) -> panic as "failed to generate dummy expertise"
    Ok(data) -> data
  }
}

pub fn new_service(database: pog.Connection) -> service.Service {
  case service.register(database, name: "dummy_service", description: "") {
    Error(_) -> panic as "failed to generate dummy service"
    Ok(data) -> data
  }
}

pub fn new_technology(database: pog.Connection) -> technology.Technology {
  case technology.register(database, name: "dummy_tech", description: "") {
    Error(_) -> panic as "failed to generate dummy technology"
    Ok(data) -> data
  }
}

pub fn new_company(database: pog.Connection) -> company.Company {
  let assert Ok(size) =
    [company.Micro, company.Small, company.Medium, company.Big]
    |> list.shuffle
    |> list.first

  let result =
    company.register(
      database,
      name: "dummy_company",
      size: size,
      email: new_email(),
      cnpj: new_cnpj(),
      password:,
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  case result {
    Error(_) -> panic as "failed to generate dummy company"
    Ok(data) -> data
  }
}

/// Run a function multiple times, useful for generating a list of values.
pub fn many(amount: Int, new: fn() -> a) -> List(a) {
  int.range(from: 1, to: amount, with: [], run: fn(acc, _) {
    let item = new()
    [item, ..acc]
  })
  |> list.reverse
}

pub fn new_demand(
  database: pog.Connection,
  from company_id: uuid.Uuid,
) -> demand.Demand {
  let result =
    demand.register(
      database,
      company_id: company_id,
      title: "wibble_title",
      description: "wibble_description",
      status: demand.Open,
    )

  case result {
    Ok(data) -> data
    Error(_) -> panic as "failed to generate dummy demand"
  }
}

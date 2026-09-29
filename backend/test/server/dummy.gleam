//// Quickly generate Data for unit tests.

import gleam/string
import pog
import server/cnpj
import server/email
import server/segment
import server/startup
import server/startup/expertise
import server/startup/service
import server/startup/technology
import youid/uuid

/// Default password for all dummy entities
pub const password = "root"

pub fn new_email() -> email.Email {
  case email.parse(uuid.v7_string() <> "@email.com") {
    Error(_) -> panic as "failed to generate dummy email"
    Ok(data) -> data
  }
}

pub fn new_cnpj() -> cnpj.Cnpj {
  case cnpj.parse(string.slice(uuid.v7_string(), 0, 14)) {
    Error(_) -> panic as "failed to generate dummy cnpj"
    Ok(data) -> data
  }
}

pub fn new_startup(database: pog.Connection) -> startup.Startup {
  let result =
    startup.register(
      database,
      name: "dummy",
      email: new_email(),
      password:,
      stage: startup.Seed,
      cnpj: new_cnpj(),
      description: "useful for tests",
      city: "Recife",
      state: "PE",
    )

  case result {
    Error(_) -> panic as "failed to generate dummy startup"
    Ok(data) -> data
  }
}

pub fn new_segment(database: pog.Connection) -> segment.Segment {
  case segment.register(database, name: "wibble", description: "wobble") {
    Error(_) -> panic as "failed to generate dummy segment"
    Ok(data) -> data
  }
}

pub fn new_expertise(database: pog.Connection) -> expertise.Expertise {
  case expertise.register(database, name: "wibble", description: "wobble") {
    Error(_) -> panic as "failed to generate dummy expertise"
    Ok(data) -> data
  }
}

pub fn new_service(database: pog.Connection) -> service.Service {
  case service.register(database, name: "wibble", description: "wobble") {
    Error(_) -> panic as "failed to generate dummy service"
    Ok(data) -> data
  }
}

pub fn new_technology(database: pog.Connection) -> technology.Technology {
  case technology.register(database, name: "wibble", description: "wobble") {
    Error(_) -> panic as "failed to generate dummy technology"
    Ok(data) -> data
  }
}

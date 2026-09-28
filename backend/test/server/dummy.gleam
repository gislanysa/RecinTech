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

/// Default password for all entities
pub const password = "root"

pub fn new_startup(database: pog.Connection) -> startup.Startup {
  let assert Ok(email) = email.parse(uuid.v7_string() <> "@email.com")
  let assert Ok(cnpj) = cnpj.parse(string.slice(uuid.v7_string(), 0, 14))

  let assert Ok(startup) =
    startup.register(
      database,
      name: "dummy",
      email: email,
      password:,
      stage: startup.Seed,
      cnpj: cnpj,
      description: "useful for tests",
      city: "Recife",
      state: "PE",
    )

  startup
}

pub fn new_segment(database: pog.Connection) -> segment.Segment {
  let assert Ok(data) =
    segment.register(database, name: "wibble", description: "wobble")

  data
}

pub fn new_expertise(database: pog.Connection) -> expertise.Expertise {
  let assert Ok(data) =
    expertise.register(database, name: "wibble", description: "wobble")

  data
}

pub fn new_service(database: pog.Connection) -> service.Service {
  let assert Ok(data) =
    service.register(database, name: "wibble", description: "wobble")

  data
}

pub fn new_technology(database: pog.Connection) -> technology.Technology {
  let assert Ok(data) =
    technology.register(database, name: "wibble", description: "wobble")

  data
}

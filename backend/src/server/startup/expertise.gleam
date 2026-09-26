//// Startups can have an area of expertise like health, education, technology,
//// finances and others.

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import pog
import server/startup/expertise/sql
import youid/uuid

pub type ExpertiseError {
  /// Expertise was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Failed to query the Database
  DatabaseError(pog.QueryError)
  /// Something went wrong when registering a new Expertise
  FailedToRegisterExpertise
}

pub type Expertise {
  Expertise(id: uuid.Uuid, name: String, description: String)
}

/// Encode a Segment into a `Expertise` object.
pub fn to_json(expertise: Expertise) -> json.Json {
  let Expertise(id:, name:, description:) = expertise
  json.object([
    #("id", uuid_to_json(id)),
    #("name", json.string(name)),
    #("description", json.string(description)),
  ])
}

/// A decoder that decodes `Expertise` values.
pub fn decoder() -> decode.Decoder(Expertise) {
  use id <- decode.field("id", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use description <- decode.field("description", decode.string)
  decode.success(Expertise(id:, name:, description:))
}

fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

/// Search an Expertise in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = expertise.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(expertise.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Expertise, ExpertiseError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  Expertise(id: row.id, name: row.name, description: row.description)
}

/// Register an Expertise in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = expertise.register(
///   context.database,
///   name: "Health",
///   description: "Medic stuff",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  name name: String,
  description description: String,
) -> Result(Expertise, ExpertiseError) {
  use returned <- result.try(
    sql.register(database, name, description)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterExpertise),
  )

  Expertise(id: row.id, name: row.name, description: row.description)
}

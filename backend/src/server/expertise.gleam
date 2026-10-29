//// Startups can have an area of expertise like health, education, technology,
//// finances and others.

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import pog
import server/expertise/sql
import server/internal
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
    #("id", internal.uuid_to_json(id)),
    #("name", json.string(name)),
    #("description", json.string(description)),
  ])
}

/// A decoder that decodes `Expertise` values.
pub fn decoder() -> decode.Decoder(Expertise) {
  use id <- decode.field("id", internal.uuid_decoder())
  use name <- decode.field("name", decode.string)
  use description <- decode.field("description", decode.string)
  decode.success(Expertise(id:, name:, description:))
}

/// Search an Expertise in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = expertise.get(context.database, id)
///
/// case result {
///   Ok(data) -> wisp.ok()
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

/// Fetch many Expertises from the database, specifying the max number of
/// returned rows, and how many to skip.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   expertise.get_many(context.database, limit: 3, offset: 6)
///
/// case result {
///   Ok(data) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_many(
  database: pog.Connection,
  limit limit: Int,
  offset offset: Int,
) -> Result(List(Expertise), ExpertiseError) {
  use returned <- result.map(
    sql.get_many(database, limit, offset)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    Expertise(id: row.id, name: row.name, description: row.description)
  })
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
///   Ok(data) -> wisp.response(201)
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

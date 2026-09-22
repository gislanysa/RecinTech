//// Startups can have an area of expertise like health, education, technology,
//// finances and others.

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

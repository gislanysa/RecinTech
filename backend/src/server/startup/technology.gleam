//// Startups can use plenty of technologies for their projects,
//// like gleam, javascript (unfortunately), postgresql or tailwind.

import gleam/list
import gleam/result
import pog
import server/startup/technology/sql
import youid/uuid

pub type TechnologyError {
  /// Failed o the query the Database
  DatabaseError(error: pog.QueryError)
  /// Technology was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Something went wrong when registering a new Technology
  FailedToRegisterTechnology
}

pub type Technology {
  Technology(id: uuid.Uuid, name: String, description: String)
}

/// Search a Technology in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = technology.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(technology.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Technology, TechnologyError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  Technology(id: row.id, name: row.name, description: row.description)
}

/// Register an Technology in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = technology.register(
///   context.database,
///   name: "Javascript",
///   description: "dont use this",
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
) -> Result(Technology, TechnologyError) {
  use returned <- result.try(
    sql.register(database, name, description)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterTechnology),
  )

  Technology(id: row.id, name: row.name, description: row.description)
}

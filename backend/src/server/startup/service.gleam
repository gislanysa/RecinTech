//// Startups can offer a lot of different services, like UI/UX design,
//// web development, AI training, automation, etc.

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import pog
import server/startup/service/sql
import youid/uuid

pub type ServiceError {
  /// Failed o the query the Database
  DatabaseError(error: pog.QueryError)
  /// Service was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Something went wrong when registering a new Service
  FailedToRegisterService
}

pub type Service {
  Service(id: uuid.Uuid, name: String, description: String)
}

pub fn decoder() -> decode.Decoder(Service) {
  use id <- decode.field("id", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use description <- decode.field("description", decode.string)
  decode.success(Service(id:, name:, description:))
}

pub fn to_json(service: Service) -> json.Json {
  let Service(id:, name:, description:) = service
  json.object([
    #("id", uuid_to_json(id)),
    #("name", json.string(name)),
    #("description", json.string(description)),
  ])
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

/// Search a Service in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = service.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(service.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Service, ServiceError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  Service(id: row.id, name: row.name, description: row.description)
}

/// Register an Service in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = service.register(
///   context.database,
///   name: "Data Analysis",
///   description: "Databases, graphics and stuff",
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
) -> Result(Service, ServiceError) {
  use returned <- result.try(
    sql.register(database, name, description)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterService),
  )

  Service(id: row.id, name: row.name, description: row.description)
}

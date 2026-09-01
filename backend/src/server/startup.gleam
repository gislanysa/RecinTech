import gleam/bool
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import gleam/time/calendar
import gleam/time/timestamp
import pog
import server/startup/sql
import server/user
import youid/uuid

pub type StartupError {
  /// Failed to connect to the Database
  DatabaseError(pog.QueryError)
  /// Something went wrong when registering a Startup
  FailedToRegisterStartup
  /// Startup was not found in the Database
  NotFound
  /// Invalid CNPJ format
  InvalidCnpjFormat
  /// Startup CNPJ must be unique
  CnpjConflict
}

pub type Startup {
  Startup(
    /// Startup ID
    id: uuid.Uuid,
    /// Startup's segment.
    segment_id: uuid.Uuid,
    /// Their name
    name: String,
    /// Their CPNJ, it must be exactly 14 digits
    cnpj: String,
    /// A description
    description: String,
    /// The city where it is located
    city: String,
    /// The state of where it is located
    state: String,
    /// When the startup was created
    created_at: timestamp.Timestamp,
  )
}

pub fn decoder() -> decode.Decoder(Startup) {
  use id <- decode.field("id", uuid_decoder())
  use segment_id <- decode.field("segment_id", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use cnpj <- decode.field("cnpj", decode.string)
  use description <- decode.field("description", decode.string)
  use city <- decode.field("city", decode.string)
  use state <- decode.field("state", decode.string)
  use created_at <- decode.field("created_at", timestamp_decoder())

  decode.success(Startup(
    id:,
    segment_id:,
    name:,
    cnpj:,
    description:,
    city:,
    state:,
    created_at:,
  ))
}

pub fn to_json(startup: Startup) -> json.Json {
  let Startup(
    id:,
    segment_id:,
    name:,
    cnpj:,
    description:,
    city:,
    state:,
    created_at:,
  ) = startup

  json.object([
    #("id", uuid_to_json(id)),
    #("segment_id", uuid_to_json(segment_id)),
    #("name", json.string(name)),
    #("cnpj", json.string(cnpj)),
    #("description", json.string(description)),
    #("city", json.string(city)),
    #("state", json.string(state)),
    #("created_at", timestamp_to_json(created_at)),
  ])
}

fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

fn timestamp_to_json(timestamp: timestamp.Timestamp) -> json.Json {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
  |> json.string()
}

fn timestamp_decoder() -> decode.Decoder(timestamp.Timestamp) {
  use text <- decode.then(decode.string)

  case timestamp.parse_rfc3339(text) {
    Ok(data) -> decode.success(data)
    Error(_) -> decode.failure(timestamp.system_time(), "rfc3339")
  }
}

/// Register an empty startup in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = startup.register(
///   context.database,
///   id,
///   "Critic Level",
///   "12345678901234",
///   "startup muito maneira",
///   "Recife",
///   "Pernambuco",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  segment_id segment: uuid.Uuid,
  name name: String,
  cnpj cnpj: String,
  description description: String,
  city city: String,
  state state: String,
) -> Result(Startup, StartupError) {
  use <- bool.guard(string.length(cnpj) != 14, Error(InvalidCnpjFormat))

  use returned <- result.try(
    case sql.register(database, segment, name, cnpj, description, city, state) {
      Error(pog.ConstraintViolated(constraint: "startup_cnpj_key", ..)) ->
        Error(CnpjConflict)

      Ok(data) -> Ok(data)
      Error(err) -> Error(DatabaseError(err))
    },
  )

  case returned.rows {
    [] -> Error(FailedToRegisterStartup)
    [row, ..] ->
      Ok(Startup(
        id: row.id,
        segment_id: row.segment_id,
        name: row.name,
        cnpj: row.cnpj,
        description: row.description,
        city: row.city,
        state: row.state,
        created_at: row.created_at,
      ))
  }
}

/// Search a startup in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(startup.NotFound) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Startup, StartupError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  case returned.rows {
    [] -> Error(NotFound)
    [row, ..] ->
      Ok(Startup(
        id: row.id,
        segment_id: row.segment_id,
        name: row.name,
        cnpj: row.cnpj,
        description: row.description,
        city: row.city,
        state: row.state,
        created_at: row.created_at,
      ))
  }
}

/// Assign a list of members to a Startup and returns
/// the ID of all successfully assigned Users.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_members(context.database, id, [member])
///
/// case result {
///   Ok(assigned) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_members(
  database: pog.Connection,
  id: uuid.Uuid,
  assign members: List(uuid.Uuid),
) -> Result(List(uuid.Uuid), StartupError) {
  use returned <- result.map(
    sql.assign_members(database, id, members)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) { row.user_id })
}

/// Get all members assigned to a given Startup.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_members(context.database, id)
///
/// case result {
///   Ok(members) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_members(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(user.User), StartupError) {
  use returned <- result.map(
    sql.get_members(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    user.User(
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      created_at: row.created_at,
      is_active: row.is_active,
    )
  })
}

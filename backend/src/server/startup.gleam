//// Types and functions for working with [Startups](#Startup)

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/calendar
import gleam/time/timestamp
import pog
import server/cnpj
import server/email
import server/segment
import server/startup/expertise
import server/startup/sql
import server/user
import youid/uuid

pub type StartupError {
  /// Failed to connect to the Database
  DatabaseError(error: pog.QueryError)
  /// Something went wrong when registering a Startup
  FailedToRegisterStartup
  /// Startup was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Member's email has invalid format
  InvalidMemberEmail(id: uuid.Uuid, value: String)
  /// User, segment, technology, etc is already assigned
  AssignmentConflict(id: uuid.Uuid)
  /// Tried to assign an entity that is not registered
  AssignedMissingEntity(id: uuid.Uuid)
  /// Failed to assign entity to a startup for unknown reasons
  AssignmentFailure(id: uuid.Uuid)

  /// CPNJ should have 14 characters
  InvalidCnpj(value: String)
  /// Startup CNPJ must be unique
  CnpjConflict(value: cnpj.Cnpj)
  /// Failed to parse a String into a [Stage](#Stage) type
  InvalidStage(value: String)
}

pub type Startup {
  Startup(
    /// Startup ID
    id: uuid.Uuid,
    /// Their name
    name: String,
    /// The stage that they are currently on
    stage: Stage,
    /// Their CPNJ, it must be exactly 14 digits
    cnpj: cnpj.Cnpj,
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

/// Tracks a startup's progress from an idea to a business
pub type Stage {
  /// Finding out if people will actually buy what you built
  Seed
  /// Expanding operations
  Growth
}

fn stage_to_json(stage: Stage) -> json.Json {
  case stage {
    Seed -> json.string("seed")
    Growth -> json.string("growth")
  }
}

fn stage_decoder() -> decode.Decoder(Stage) {
  use variant <- decode.then(decode.string)
  case variant {
    "seed" -> decode.success(Seed)
    "growth" -> decode.success(Growth)
    _ -> decode.failure(Seed, "Stage")
  }
}

/// Parse a String into a valid [Stage](#Stage) type
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(stage) = startup.stage_from_string("seed")
/// assert stage == startup.Seed
///
/// let assert Error(startup.InvalidStage(_)) =
///   startup.stage_from_string("wibble")
/// ```
pub fn stage_from_string(value: String) -> Result(Stage, StartupError) {
  case value {
    "seed" -> Ok(Seed)
    "growth" -> Ok(Growth)

    _ -> Error(InvalidStage(value))
  }
}

/// A decoder that decodes `Startup` values.
pub fn decoder() -> decode.Decoder(Startup) {
  use id <- decode.field("id", uuid_decoder())
  use name <- decode.field("name", decode.string)
  use stage <- decode.field("stage", stage_decoder())
  use cnpj <- decode.field("cnpj", cnpj.decoder())
  use description <- decode.field("description", decode.string)
  use city <- decode.field("city", decode.string)
  use state <- decode.field("state", decode.string)
  use created_at <- decode.field("created_at", timestamp_decoder())

  Startup(id:, name:, stage:, cnpj:, description:, city:, state:, created_at:)
  |> decode.success
}

/// Encode a Startup into a JSON object.
pub fn to_json(startup: Startup) -> json.Json {
  json.object([
    #("id", uuid_to_json(startup.id)),
    #("name", json.string(startup.name)),
    #("stage", stage_to_json(startup.stage)),
    #("cnpj", json.string(cnpj.to_string(startup.cnpj))),
    #("description", json.string(startup.description)),
    #("city", json.string(startup.city)),
    #("state", json.string(startup.state)),
    #("created_at", timestamp_to_json(startup.created_at)),
  ])
}

/// Encode a `uuid.Uuid` into a json string.
fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

/// A decoder that decodes `uuid.Uuid` values.
fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

/// Encode a `timestamp.Timestamp` into a rfc3339 JSON string.
fn timestamp_to_json(timestamp: timestamp.Timestamp) -> json.Json {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
  |> json.string()
}

/// A decoder that decodes `timestamp.Timestamp` rfc3339 values.
fn timestamp_decoder() -> decode.Decoder(timestamp.Timestamp) {
  use string <- decode.then(decode.string)
  case timestamp.parse_rfc3339(string) {
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
///   name: "Critic Level",
///   stage: startup.Seed,
///   cnpj: cnpj,
///   description: "startup muito maneira",
///   city: "Recife",
///   state: "Pernambuco",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(startup.CnpjConflict) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  name name: String,
  stage stage: Stage,
  cnpj cnpj: cnpj.Cnpj,
  description description: String,
  city city: String,
  state state: String,
) -> Result(Startup, StartupError) {
  let s_cnpj = cnpj.to_string(cnpj)
  let stage = stage_to_enum(stage)

  use returned <- result.try(
    case sql.register(database, name, stage, s_cnpj, description, city, state) {
      // Every Startup CNPJ needs to be unique.
      Error(pog.ConstraintViolated(constraint: "startup_cnpj_key", ..)) ->
        Error(CnpjConflict(value: cnpj))

      // A CNPJ needs to have exactly 14 digits.
      Error(pog.ConstraintViolated(constraint: "startup_cnpj_check", ..)) ->
        Error(InvalidCnpj(value: s_cnpj))

      Ok(data) -> Ok(data)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterStartup),
  )

  use cnpj <- result.map(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  Startup(
    id: row.id,
    name: row.name,
    stage: stage_from_enum(row.stage),
    cnpj: cnpj,
    description: row.description,
    city: row.city,
    state: row.state,
    created_at: row.created_at,
  )
}

/// Convert the sql-generated StartupStage enum to a valid [Stage](#Stage) type.
fn stage_from_enum(enum: sql.StartupStage) -> Stage {
  case enum {
    sql.Seed -> Seed
    sql.Growth -> Growth
  }
}

/// Convert a [Stage](#Stage) to its sql-generated counterpart.
fn stage_to_enum(stage: Stage) -> sql.StartupStage {
  case stage {
    Seed -> sql.Seed
    Growth -> sql.Growth
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
///   Error(startup.NotFound(_)) -> wisp.not_found()
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

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  use cnpj <- result.map(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  Startup(
    id: row.id,
    name: row.name,
    stage: stage_from_enum(row.stage),
    cnpj: cnpj,
    description: row.description,
    city: row.city,
    state: row.state,
    created_at: row.created_at,
  )
}

/// Assign a member to a Startup and returns the ID of the user if successful.
/// You cannot assign a member to a startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_member(context.database, id, assign: member)
///
/// case result {
///   Ok(assigned_user_id) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_member(
  database: pog.Connection,
  id: uuid.Uuid,
  assign member: uuid.Uuid,
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(case sql.assign_member(database, id, member) {
    // Tried to assign an User to a Startup that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_membership_startup_id_fkey",
      ..,
    )) -> Error(NotFound(id:))

    // Tried to assign an User that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_membership_user_id_fkey",
      ..,
    )) -> Error(AssignedMissingEntity(id: member))

    // Tried to assign an User that is already assigned
    Error(pog.ConstraintViolated(constraint: "startup_membership_pkey", ..)) ->
      Error(AssignmentConflict(id: member))

    Ok(rows) -> Ok(rows)
    Error(error) -> Error(DatabaseError(error:))
  })

  case list.first(returned.rows) {
    Ok(row) -> Ok(row.user_id)
    Error(_) -> Error(AssignmentFailure(id: member))
  }
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
  use <- ensure_exists(database, id)

  use returned <- result.try(
    sql.get_members(database, id)
    |> result.map_error(DatabaseError),
  )

  list.try_map(returned.rows, fn(row) {
    use email <- result.map(
      email.parse(row.email)
      |> result.replace_error(InvalidMemberEmail(id: row.id, value: row.email)),
    )

    user.User(
      id: row.id,
      full_name: row.full_name,
      email: email,
      created_at: row.created_at,
      is_active: row.is_active,
    )
  })
}

/// Get all segments that a Startup is assigned to.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_segments(context.database, id)
///
/// case result {
///   Ok(segments) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_segments(
  database: pog.Connection,
  from id: uuid.Uuid,
) -> Result(List(segment.Segment), StartupError) {
  use <- ensure_exists(database, id)

  use returned <- result.map(
    sql.get_segments(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    segment.Segment(id: row.id, name: row.name, description: row.description)
  })
}

/// Sometime it can be a good idea to check if a Startup exists before
/// performing a query. This middleware returns `Error(NotFound(_))`
/// if a Startup is not registered.
///
/// ## Examples
///
/// ```gleam
/// use <- ensure_exists(database, id)
///
/// use returned <- result.map(
///   sql.get_members(database, id)
///   |> result.map_error(DatabaseError),
/// )
/// ```
pub fn ensure_exists(
  database: pog.Connection,
  id: uuid.Uuid,
  next: fn() -> Result(a, StartupError),
) -> Result(a, StartupError) {
  use returned <- result.try(
    sql.ensure_exists(database, id)
    |> result.map_error(DatabaseError),
  )

  use _found <- result.try(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  next()
}

/// Assign a Segment to a Startup and returns the ID of the segment if successful.
/// You cannot assign a segment to a startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_segment(
///   context.database,
///   startup_id,
///   assign: segment_id,
///   as_main_segment: True,
///   )
///
/// case result {
///   Ok(assigned) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_segment(
  database: pog.Connection,
  id: uuid.Uuid,
  assign segment: uuid.Uuid,
  as_main_segment as_main_segment: Bool,
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(
    case sql.assign_segment(database, id, segment, as_main_segment) {
      // Tried to assign an Segment to a Startup that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_segment_startup_id_fkey",
        ..,
      )) -> Error(NotFound(id:))

      // Tried to assign an Segment that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_segment_segment_id_fkey",
        ..,
      )) -> Error(AssignedMissingEntity(id: segment))

      // Segment has already been assigned to the given Startup
      Error(pog.ConstraintViolated(constraint: "startup_segment_pkey", ..)) ->
        Error(AssignmentConflict(id: segment))

      Ok(rows) -> Ok(rows)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  case list.first(returned.rows) {
    Ok(row) -> Ok(row.segment_id)
    Error(_) -> Error(AssignmentFailure(id: segment))
  }
}

/// Assign an Expertise to a Startup and returns the ID of the expertise
/// if successful. You cannot assign the same expertise to a startup more
/// than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_expertise(
///   context.database,
///   startup_id,
///   assign: expertise_id,
///   )
///
/// case result {
///   Ok(assigned) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_expertise(
  database: pog.Connection,
  id: uuid.Uuid,
  assign expertise: uuid.Uuid,
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(
    case sql.assign_expertise(database, id, expertise) {
      // Tried to assign an Segment to a Startup that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_expertise_startup_id_fkey",
        ..,
      )) -> Error(NotFound(id:))

      // Tried to assign an Expertise that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_expertise_expertise_id_fkey",
        ..,
      )) -> Error(AssignedMissingEntity(id: expertise))

      // Expertise has already been assigned to the given Startup
      Error(pog.ConstraintViolated(constraint: "startup_expertise_pkey", ..)) ->
        Error(AssignmentConflict(id: expertise))

      Ok(rows) -> Ok(rows)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  case list.first(returned.rows) {
    Ok(row) -> Ok(row.expertise_id)
    Error(_) -> Error(AssignmentFailure(id: expertise))
  }
}

/// Get all expertises that a Startup is assigned to
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_expertises(context.database, id)
///
/// case result {
///   Ok(segments) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_expertises(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(expertise.Expertise), StartupError) {
  use <- ensure_exists(database, id)

  use returned <- result.map(
    sql.get_expertises(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    expertise.Expertise(
      id: row.id,
      name: row.name,
      description: row.description,
    )
  })
}

/// Assign a Service to a Startup and returns the ID of the service
/// if successful. You cannot assign a service to a startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_service(
///   context.database,
///   startup_id,
///   assign: service_id,
///   )
///
/// case result {
///   Ok(assigned) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_service(
  database: pog.Connection,
  id: uuid.Uuid,
  assign service: uuid.Uuid,
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(case sql.assign_service(database, id, service) {
    // Tried to assign a Service to a Startup that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_service_startup_id_fkey",
      ..,
    )) -> Error(NotFound(id:))

    // Tried to assign an Expertise that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_service_service_id_fkey",
      ..,
    )) -> Error(AssignedMissingEntity(id: service))

    // Expertise has already been assigned to the given Startup
    Error(pog.ConstraintViolated(constraint: "startup_service_pkey", ..)) ->
      Error(AssignmentConflict(id: service))

    Ok(rows) -> Ok(rows)
    Error(error) -> Error(DatabaseError(error))
  })

  case list.first(returned.rows) {
    Ok(row) -> Ok(row.service_id)
    Error(_) -> Error(AssignmentFailure(id: service))
  }
}

/// Assign a Technology to a Startup and returns the ID of the technology
/// if successful. You cannot assign a technology to a startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_technology(
///   context.database,
///   startup_id,
///   assign: technology_id,
///   )
///
/// case result {
///   Ok(assigned) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_technology(
  database: pog.Connection,
  id: uuid.Uuid,
  assign technology: uuid.Uuid,
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(
    case sql.assign_technology(database, id, technology) {
      // Tried to assign a Technology to a Startup that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_technology_startup_id_fkey",
        ..,
      )) -> Error(NotFound(id:))

      // Tried to assign a Technology that is not registered.
      Error(pog.ConstraintViolated(
        constraint: "startup_technology_technology_id_fkey",
        ..,
      )) -> Error(AssignedMissingEntity(id: technology))

      // Technology has already been assigned to the given Startup
      Error(pog.ConstraintViolated(constraint: "startup_technology_pkey", ..)) ->
        Error(AssignmentConflict(id: technology))

      Ok(rows) -> Ok(rows)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  case list.first(returned.rows) {
    Ok(row) -> Ok(row.technology_id)
    Error(_) -> Error(AssignmentFailure(id: technology))
  }
}

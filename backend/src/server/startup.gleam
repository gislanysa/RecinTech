//// Types and functions for working with [Startups](#Startup)

import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/cnpj
import server/email
import server/internal
import server/segment
import server/startup/expertise
import server/startup/service
import server/startup/sql
import server/startup/technology
import youid/uuid

pub type StartupError {
  /// Failed to connect to the Database
  DatabaseError(error: pog.QueryError)
  /// Something went wrong when registering a Startup
  FailedToRegisterStartup
  /// Startup was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Segment, technology, etc is already assigned
  AssignmentConflict(id: uuid.Uuid)
  /// Tried to assign an entity that is not registered
  AssignedMissingEntity(id: uuid.Uuid)
  /// Failed to assign entity to a startup for unknown reasons
  AssignmentFailure(id: uuid.Uuid)
  /// Failed to hash the Startup password
  HashError(argus.HashError)

  /// CPNJ should have 14 characters
  InvalidCnpj(value: String)
  /// Startup CNPJ must be unique
  CnpjConflict(value: cnpj.Cnpj)
  /// Failed to parse a String into a [Stage](#Stage) type
  InvalidStage(value: String)

  // Email related errors -----------------------------------------------------
  //
  /// Email doesn't belong to a registered Startup
  EmailNotFound(email: email.Email)
  /// Startup emails need to be unique
  EmailConflict(value: email.Email)
  /// Startup email has invalid format
  InvalidEmail(value: String)

  // Auth related errors -------------------------------------------------------
  //
  /// Startup provided an incorrect password when during login
  WrongPassword
}

pub type Startup {
  Startup(
    /// Startup ID
    id: uuid.Uuid,
    /// Their name
    name: String,
    /// Their name
    email: email.Email,
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
    /// Whether the Startup is active
    is_active: Bool,
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
  use id <- decode.field("id", internal.uuid_decoder())
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", email.decoder())
  use stage <- decode.field("stage", stage_decoder())
  use cnpj <- decode.field("cnpj", cnpj.decoder())
  use description <- decode.field("description", decode.string)
  use city <- decode.field("city", decode.string)
  use state <- decode.field("state", decode.string)
  use created_at <- decode.field("created_at", internal.timestamp_decoder())
  use is_active <- decode.field("is_active", decode.bool)

  decode.success(Startup(
    id:,
    name:,
    stage:,
    email:,
    cnpj:,
    description:,
    city:,
    state:,
    created_at:,
    is_active:,
  ))
}

/// Encode a Startup into a JSON object.
pub fn to_json(startup: Startup) -> json.Json {
  json.object([
    #("id", internal.uuid_to_json(startup.id)),
    #("name", json.string(startup.name)),
    #("email", json.string(email.to_string(startup.email))),
    #("stage", stage_to_json(startup.stage)),
    #("cnpj", json.string(cnpj.to_string(startup.cnpj))),
    #("description", json.string(startup.description)),
    #("city", json.string(startup.city)),
    #("state", json.string(startup.state)),
    #("created_at", internal.timestamp_to_json(startup.created_at)),
    #("is_active", json.bool(startup.is_active)),
  ])
}

/// Register an empty startup in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = startup.register(
///   context.database,
///   name: "Critic Level",
///   email: email,
///   password: "wibble",
///   stage: startup.Seed,
///   cnpj: cnpj,
///   description: "startup muito maneira",
///   city: "Recife",
///   state: "Pernambuco",
/// )
///
/// case result {
///   Error(startup.CnpjConflict(..))
///   | Error(startup.EmailConflict(..)) -> wisp.response(409)
///
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  name name: String,
  email email: email.Email,
  password password: String,
  stage stage: Stage,
  cnpj cnpj: cnpj.Cnpj,
  description description: String,
  city city: String,
  state state: String,
) -> Result(Startup, StartupError) {
  let stage = stage_to_enum(stage)

  use hash <- result.try(
    argus.hasher()
    |> argus.hash(password)
    |> result.map_error(HashError)
    |> result.map(fn(output) { output.encoded_hash }),
  )

  let register_result =
    sql.register(
      database,
      name,
      stage,
      email.to_string(email),
      hash,
      cnpj.to_string(cnpj),
      description,
      city,
      state,
    )

  use returned <- result.try(case register_result {
    // Every Startup CNPJ needs to be unique.
    Error(pog.ConstraintViolated(constraint: "startup_cnpj_key", ..)) ->
      Error(CnpjConflict(value: cnpj))

    // A CNPJ needs to have exactly 14 digits.
    Error(pog.ConstraintViolated(constraint: "startup_cnpj_check", ..)) ->
      Error(InvalidCnpj(value: cnpj.to_string(cnpj)))

    // Every Startup Email needs to be unique.
    Error(pog.ConstraintViolated(constraint: "startup_email_key", ..)) ->
      Error(EmailConflict(value: email))

    Ok(data) -> Ok(data)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterStartup),
  )

  use cnpj <- result.try(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  use email <- result.map(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  Startup(
    id: row.id,
    name: row.name,
    email:,
    stage: stage_from_enum(row.stage),
    cnpj:,
    description: row.description,
    city: row.city,
    state: row.state,
    created_at: row.created_at,
    is_active: row.is_active,
  )
}

/// Verifies the provided `email` and `password`, checking if they matche the
/// ones stored in our Database. Returning Startup information if correct.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.verify(
///   context.database,
///   email: "my@email.com",
///   password: "password",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(startup.NotFound) -> wisp.not_found()
///   Error(startup.WrongPassword) -> wisp.response(401)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn verify(
  database: pog.Connection,
  email email: email.Email,
  password password: String,
) -> Result(Startup, StartupError) {
  use returned <- result.try(
    sql.get_credentials(database, email.to_string(email))
    |> result.map_error(DatabaseError),
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(EmailNotFound(email:)),
  )

  // Comparing the given password with the value stored in our Database
  case argus.verify(row.password_hash, password) {
    // Correct password, we can query the user information
    // and send it to the client.
    Ok(True) -> get(database, row.id)

    // Incorrect password
    Ok(False) -> Error(WrongPassword)

    // Something went wrong when hashing the user password
    Error(error) -> Error(HashError(error))
  }
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

  use cnpj <- result.try(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  use email <- result.map(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  Startup(
    id: row.id,
    name: row.name,
    email:,
    stage: stage_from_enum(row.stage),
    cnpj:,
    description: row.description,
    city: row.city,
    state: row.state,
    created_at: row.created_at,
    is_active: row.is_active,
  )
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
///   sql.get_segments(database, id)
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

  case list.first(returned.rows) {
    Ok(_) -> next()
    Error(_) -> Error(NotFound(id:))
  }
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
) -> Result(uuid.Uuid, StartupError) {
  use returned <- result.try(case sql.assign_segment(database, id, segment) {
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
  })

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

/// Get all technologies that a Startup is assigned to
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_technologies(context.database, id)
///
/// case result {
///   Ok(technologies) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_technologies(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(technology.Technology), StartupError) {
  use <- ensure_exists(database, id)

  use returned <- result.map(
    sql.get_technologies(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    technology.Technology(
      id: row.id,
      name: row.name,
      description: row.description,
    )
  })
}

/// Get all services that a Startup is assigned to
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_services(context.database, id)
///
/// case result {
///   Ok(services) -> todo as "send response"
///   Error(startup.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_services(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(service.Service), StartupError) {
  use <- ensure_exists(database, id)

  use returned <- result.map(
    sql.get_services(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    service.Service(id: row.id, name: row.name, description: row.description)
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

/// Fetch many Startups from the database, specifying the max number of
/// returned rows, and how many to skip.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   startup.get_many(context.database, limit: 3, offset: 6)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_many(
  database: pog.Connection,
  limit limit: Int,
  offset offset: Int,
) -> Result(List(Startup), StartupError) {
  use returned <- result.try(
    sql.get_many(database, limit, offset)
    |> result.map_error(DatabaseError),
  )

  list.try_map(returned.rows, fn(row) {
    use cnpj <- result.try(
      cnpj.parse(row.cnpj)
      |> result.replace_error(InvalidCnpj(value: row.cnpj)),
    )

    use email <- result.map(
      email.parse(row.email)
      |> result.replace_error(InvalidEmail(value: row.email)),
    )

    Startup(
      id: row.id,
      name: row.name,
      email:,
      stage: stage_from_enum(row.stage),
      cnpj: cnpj,
      description: row.description,
      city: row.city,
      state: row.state,
      created_at: row.created_at,
      is_active: row.is_active,
    )
  })
}

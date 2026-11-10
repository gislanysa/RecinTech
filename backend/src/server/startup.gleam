//// Startups are early-stage companies from Porto Digital that offer
//// technological solutions to [Companies](company.html#Company).

import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/time/timestamp
import gleam/uri
import pog
import server/cnpj
import server/connection
import server/email
import server/expertise
import server/internal
import server/lgpd
import server/segment
import server/service
import server/startup/sql
import server/technology
import youid/uuid

pub type StartupError {
  /// Failed to query the Database
  DatabaseError(error: pog.QueryError)
  /// LGPD related errors
  LgpdError(lgpd.LgpdError)
  /// Failed to hash the Startup password
  HashError(argus.HashError)

  /// Something went wrong when registering a Startup
  FailedToRegisterStartup
  /// Something went wrong when updating a Startup
  FailedToUpdateStartup(uuid.Uuid)
  /// Startup was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Startup provided an incorrect password during login
  WrongPassword
  /// CNPJ should have 14 characters
  InvalidCnpj(value: String)
  /// Startup has an invalid website
  InvalidWebsite(value: String)
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

  // Assignment errors --------------------------------------------------------
  //
  /// The entity is already assigned to the Startup
  AssignmentConflict(id: uuid.Uuid)
  /// Tried to assign an entity that is not registered
  AssignedMissingEntity(id: uuid.Uuid)
  /// Failed to assign an entity to a Startup for unknown reasons
  AssignmentFailure(id: uuid.Uuid)
  /// Failed to unassign an entity from a Startup because the assignment was
  /// not found
  AssignmentNotFound(id: uuid.Uuid)

  /// No pending connection requests found from the given company
  ConnectionNotFound(from: uuid.Uuid)
}

pub type Startup {
  Startup(
    /// The Startup's unique identifier
    id: uuid.Uuid,
    /// The Startup's name
    name: String,
    /// The Startup's email address
    email: email.Email,
    /// The stage the Startup is currently on
    stage: Stage,
    /// The Startup's CNPJ, it must be exactly 14 digits
    cnpj: cnpj.Cnpj,
    /// A description of the Startup
    description: String,
    /// The city where the Startup is located
    city: String,
    /// The state where the Startup is located
    state: String,
    /// The Startup's website
    website: uri.Uri,
    /// Whether the Startup is active
    is_active: Bool,
    /// When the Startup was created
    created_at: timestamp.Timestamp,
    /// When the Startup was last updated
    updated_at: timestamp.Timestamp,
  )
}

/// Tracks a Startup's progress from an idea to a business
pub type Stage {
  /// Early evidence of product-market fit: adoption and demand are starting to
  /// grow.
  /// > "Tração", in portuguese.
  Traction
  /// The Startup is expanding operations; growth is fast and validated.
  /// > "Escala", in portuguese.
  Scaling
}

/// Encode a startup Stage into JSON
@internal
pub fn stage_to_json(stage: Stage) -> json.Json {
  case stage {
    Traction -> json.string("traction")
    Scaling -> json.string("scaling")
  }
}

/// A decoder that decodes `Stage` values.
@internal
pub fn stage_decoder() -> decode.Decoder(Stage) {
  use variant <- decode.then(decode.string)
  case variant {
    "traction" -> decode.success(Traction)
    "scaling" -> decode.success(Scaling)
    _ -> decode.failure(Traction, "Stage")
  }
}

/// Parse a String into a valid [Stage](#Stage) type
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(stage) = startup.parse_stage("traction")
/// assert stage == startup.Traction
///
/// let assert Error(startup.InvalidStage(_)) = startup.parse_stage("wibble")
/// ```
pub fn parse_stage(value: String) -> Result(Stage, StartupError) {
  case value {
    "traction" -> Ok(Traction)
    "scaling" -> Ok(Scaling)

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
  use website <- decode.field("website", internal.uri_decoder())
  use is_active <- decode.field("is_active", decode.bool)
  use created_at <- decode.field("created_at", internal.timestamp_decoder())
  use updated_at <- decode.field("updated_at", internal.timestamp_decoder())

  decode.success(Startup(
    id:,
    name:,
    stage:,
    email:,
    cnpj:,
    description:,
    city:,
    state:,
    website:,
    is_active:,
    created_at:,
    updated_at:,
  ))
}

/// Encode a Startup into JSON
pub fn to_json(startup: Startup) -> json.Json {
  let Startup(
    id:,
    name:,
    email:,
    stage:,
    cnpj:,
    description:,
    city:,
    state:,
    website:,
    is_active:,
    created_at:,
    updated_at:,
  ) = startup

  json.object([
    #("id", internal.uuid_to_json(id)),
    #("name", json.string(name)),
    #("email", json.string(email.to_string(email))),
    #("stage", stage_to_json(stage)),
    #("cnpj", json.string(cnpj.to_string(cnpj))),
    #("description", json.string(description)),
    #("city", json.string(city)),
    #("state", json.string(state)),
    #("website", internal.uri_to_json(website)),
    #("is_active", json.bool(is_active)),
    #("created_at", internal.timestamp_to_json(created_at)),
    #("updated_at", internal.timestamp_to_json(updated_at)),
  ])
}

/// Register a Startup in the Database.
///
/// The password is hashed before being stored, and both the email and CNPJ must
/// be unique.
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(website) = uri.parse("wibble.com")
///
/// let result = startup.register(
///   context.database,
///   name: "Critic Level",
///   email: email,
///   password: "wibble",
///   stage: startup.Traction,
///   cnpj: cnpj,
///   description: "startup muito maneira",
///   city: "Recife",
///   state: "Pernambuco",
///   website: website,
/// )
///
/// case result {
///   Error(startup.CnpjConflict(..))
///   | Error(startup.EmailConflict(..)) -> wisp.response(409)
///
///   Ok(startup) -> wisp.response(201)
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
  website website: uri.Uri,
) -> Result(Startup, StartupError) {
  use hash <- result.try(
    argus.hasher()
    |> argus.hash(password)
    |> result.map_error(HashError)
    |> result.map(fn(output) { output.encoded_hash }),
  )

  let result =
    sql.register(
      database,
      name,
      stage_to_enum(stage),
      email.to_string(email),
      hash,
      cnpj.to_string(cnpj),
      description,
      city,
      state,
      uri.to_string(website),
    )

  use returned <- result.try(case result {
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

  use email <- result.try(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  use website <- result.map(
    uri.parse(row.website)
    |> result.replace_error(InvalidWebsite(value: row.website)),
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
    updated_at: row.updated_at,
    is_active: row.is_active,
    website: website,
  )
}

/// Verifies the provided `email` and `password`, checking if they match the
/// ones stored in our Database. Returns the Startup's information if correct.
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
///   Error(startup.EmailNotFound(..))
///   | Error(startup.WrongPassword) -> wisp.response(401)
///   Ok(startup) -> wisp.ok()
///   Error(startup.NotFound(_)) -> wisp.not_found()
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
    sql.Traction -> Traction
    sql.Scaling -> Scaling
  }
}

/// Convert a [Stage](#Stage) to its sql-generated counterpart.
fn stage_to_enum(stage: Stage) -> sql.StartupStage {
  case stage {
    Traction -> sql.Traction
    Scaling -> sql.Scaling
  }
}

/// Fetch a Startup from the Database by ID.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get(context.database, id)
///
/// case result {
///   Ok(startup) -> wisp.ok()
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

  use email <- result.try(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  use website <- result.map(
    uri.parse(row.website)
    |> result.replace_error(InvalidWebsite(value: row.website)),
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
    updated_at: row.updated_at,
    is_active: row.is_active,
    website:,
  )
}

/// Get all segments that a Startup is assigned to.
///
/// Returns an empty list if the Startup has no assigned segments, or if the
/// Startup does not exist. Use [ensure_exists](#ensure_exists) first if you need
/// to distinguish those cases.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_segments(context.database, id)
///
/// case result {
///   Ok(segments) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_segments(
  database: pog.Connection,
  from id: uuid.Uuid,
) -> Result(List(segment.Segment), StartupError) {
  use returned <- result.map(
    sql.get_segments(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    segment.Segment(id: row.id, name: row.name, description: row.description)
  })
}

/// Sometimes it can be a good idea to check if a Startup exists before
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

/// Assign a Segment to a Startup and return the assigned Segment if successful.
/// A Segment cannot be assigned to the same Startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_segment(
///   context.database,
///   startup_id,
///   assign: segment_id,
/// )
///
/// case result {
///   Ok(assigned) -> wisp.response(201)
///   Error(startup.NotFound(..))
///   | Error(startup.AssignedMissingEntity(..)) -> wisp.not_found()
///   Error(startup.AssignmentConflict(..)) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_segment(
  database: pog.Connection,
  id: uuid.Uuid,
  assign segment: uuid.Uuid,
) -> Result(segment.Segment, StartupError) {
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

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(id: segment)),
  )

  segment.Segment(id: row.id, name: row.name, description: row.description)
}

/// Unassign a Segment from a Startup.
///
/// Returns `AssignmentNotFound` if the Segment is not assigned to the Startup.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.unassign_segment(
///   context.database,
///   startup_id,
///   unassign: segment_id,
/// )
///
/// case result {
///   Ok(deleted) -> wisp.ok()
///   Error(startup.AssignmentNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn unassign_segment(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign segment: uuid.Uuid,
) -> Result(segment.Segment, StartupError) {
  use returned <- result.try(
    sql.unassign_segment(database, id, segment)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(id: segment)),
  )

  segment.Segment(id: row.id, name: row.name, description: row.description)
}

/// Assign an Expertise to a Startup and return the assigned Expertise if
/// successful. The same Expertise cannot be assigned to a Startup more than
/// once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_expertise(
///   context.database,
///   startup_id,
///   assign: expertise_id,
/// )
///
/// case result {
///   Ok(assigned) -> wisp.response(201)
///   Error(startup.NotFound(..))
///   | Error(startup.AssignedMissingEntity(..)) -> wisp.not_found()
///   Error(startup.AssignmentConflict(..)) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_expertise(
  database: pog.Connection,
  id: uuid.Uuid,
  assign expertise: uuid.Uuid,
) -> Result(expertise.Expertise, StartupError) {
  use returned <- result.try(
    case sql.assign_expertise(database, id, expertise) {
      // Tried to assign an Expertise to a Startup that is not registered.
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

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(id: expertise)),
  )

  expertise.Expertise(id: row.id, name: row.name, description: row.description)
}

/// Unassign an Expertise from a Startup.
///
/// Returns `AssignmentNotFound` if the Expertise is not assigned to the Startup.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.unassign_expertise(
///   context.database,
///   startup_id,
///   unassign: expertise_id,
/// )
///
/// case result {
///   Ok(deleted) -> wisp.ok()
///   Error(startup.AssignmentNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn unassign_expertise(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign expertise: uuid.Uuid,
) -> Result(expertise.Expertise, StartupError) {
  use returned <- result.try(
    sql.unassign_expertise(database, id, expertise)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(id: expertise)),
  )

  expertise.Expertise(id: row.id, name: row.name, description: row.description)
}

/// Get all Expertises that a Startup is assigned to.
///
/// Returns an empty list if the Startup has no assigned Expertises, or if the
/// Startup does not exist. Use [ensure_exists](#ensure_exists) first if you need
/// to distinguish those cases.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_expertises(context.database, id)
///
/// case result {
///   Ok(expertises) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_expertises(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(expertise.Expertise), StartupError) {
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

/// Get all Technologies that a Startup is assigned to.
///
/// Returns an empty list if the Startup has no assigned Technologies, or if the
/// Startup does not exist. Use [ensure_exists](#ensure_exists) first if you need
/// to distinguish those cases.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_technologies(context.database, id)
///
/// case result {
///   Ok(technologies) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_technologies(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(technology.Technology), StartupError) {
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

/// Get all Services that a Startup is assigned to.
///
/// Returns an empty list if the Startup has no assigned Services, or if the
/// Startup does not exist. Use [ensure_exists](#ensure_exists) first if you need
/// to distinguish those cases.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_services(context.database, id)
///
/// case result {
///   Ok(services) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_services(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(service.Service), StartupError) {
  use returned <- result.map(
    sql.get_services(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    service.Service(id: row.id, name: row.name, description: row.description)
  })
}

/// Assign a Service to a Startup and return the assigned Service if successful.
/// The same Service cannot be assigned to a Startup more than once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_service(
///   context.database,
///   startup_id,
///   assign: service_id,
/// )
///
/// case result {
///   Ok(assigned) -> wisp.response(201)
///   Error(startup.NotFound(..))
///   | Error(startup.AssignedMissingEntity(..)) -> wisp.not_found()
///   Error(startup.AssignmentConflict(..)) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_service(
  database: pog.Connection,
  id: uuid.Uuid,
  assign service: uuid.Uuid,
) -> Result(service.Service, StartupError) {
  use returned <- result.try(case sql.assign_service(database, id, service) {
    // Tried to assign a Service to a Startup that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_service_startup_id_fkey",
      ..,
    )) -> Error(NotFound(id:))

    // Tried to assign a Service that is not registered.
    Error(pog.ConstraintViolated(
      constraint: "startup_service_service_id_fkey",
      ..,
    )) -> Error(AssignedMissingEntity(id: service))

    // Service has already been assigned to the given Startup
    Error(pog.ConstraintViolated(constraint: "startup_service_pkey", ..)) ->
      Error(AssignmentConflict(id: service))

    Ok(rows) -> Ok(rows)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(id: service)),
  )

  service.Service(id: row.id, name: row.name, description: row.description)
}

/// Unassign a Service from a Startup.
///
/// Returns `AssignmentNotFound` if the Service is not assigned to the Startup.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.unassign_service(
///   context.database,
///   startup_id,
///   unassign: service_id,
/// )
///
/// case result {
///   Ok(deleted) -> wisp.ok()
///   Error(startup.AssignmentNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn unassign_service(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign service: uuid.Uuid,
) -> Result(service.Service, StartupError) {
  use returned <- result.try(
    sql.unassign_service(database, id, service)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(id: service)),
  )

  service.Service(id: row.id, name: row.name, description: row.description)
}

/// Assign a Technology to a Startup and return the assigned Technology if
/// successful. The same Technology cannot be assigned to a Startup more than
/// once.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.assign_technology(
///   context.database,
///   startup_id,
///   assign: technology_id,
/// )
///
/// case result {
///   Ok(assigned) -> wisp.response(201)
///   Error(startup.NotFound(..))
///   | Error(startup.AssignedMissingEntity(..)) -> wisp.not_found()
///   Error(startup.AssignmentConflict(..)) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn assign_technology(
  database: pog.Connection,
  id: uuid.Uuid,
  assign technology: uuid.Uuid,
) -> Result(technology.Technology, StartupError) {
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

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(id: technology)),
  )

  technology.Technology(
    id: row.id,
    name: row.name,
    description: row.description,
  )
}

/// Unassign a Technology from a Startup.
///
/// Returns `AssignmentNotFound` if the Technology is not assigned to the
/// Startup.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.unassign_technology(
///   context.database,
///   startup_id,
///   unassign: technology_id,
/// )
///
/// case result {
///   Ok(deleted) -> wisp.ok()
///   Error(startup.AssignmentNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn unassign_technology(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign technology: uuid.Uuid,
) -> Result(technology.Technology, StartupError) {
  use returned <- result.try(
    sql.unassign_technology(database, id, technology)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(id: technology)),
  )

  technology.Technology(
    id: row.id,
    name: row.name,
    description: row.description,
  )
}

/// Fetch many Startups from the database, specifying the max number of
/// returned rows, and how many to skip.
///
/// ## Examples
///
/// ```gleam
/// case startup.get_many(context.database, limit: 3, offset: 6) {
///   Ok(startups) -> wisp.ok()
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

    use email <- result.try(
      email.parse(row.email)
      |> result.replace_error(InvalidEmail(value: row.email)),
    )

    use website <- result.map(
      uri.parse(row.website)
      |> result.replace_error(InvalidWebsite(value: row.website)),
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
      updated_at: row.updated_at,
      is_active: row.is_active,
      website:,
    )
  })
}

/// Get all LGPD consent records for a given Startup.
///
/// Returns an empty list if the Startup has no consent records, or if the
/// Startup does not exist. Use [ensure_exists](#ensure_exists) first if you need
/// to distinguish those cases.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.get_lgpd_consent(context.database, id)
///
/// case result {
///   Ok(consent) -> wisp.ok()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_lgpd_consent(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(lgpd.Consent), StartupError) {
  use returned <- result.map(
    sql.get_lgpd_consent(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    case row.consent {
      sql.Granted ->
        lgpd.Granted(
          lgpd.Startup(id:),
          updated_at: row.updated_at,
          version: row.policy_version,
        )

      sql.Revoked ->
        lgpd.Revoked(
          lgpd.Startup(id:),
          updated_at: row.updated_at,
          version: row.policy_version,
        )
    }
  })
}

/// Grant LGPD (Lei Geral de Proteção de Dados) consent for a Startup at a
/// given policy version. Once granted, the Startup allows its data to be used
/// as described by that version of the privacy policy.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.grant_lgpd_consent(context.database, id, version: 1)
///
/// case result {
///   Ok(lgpd.Granted(..)) -> wisp.ok()
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
@internal
pub fn grant_lgpd_consent(
  database: pog.Connection,
  id: uuid.Uuid,
  version version: Int,
) -> Result(lgpd.Consent, StartupError) {
  lgpd.grant_consent(database, lgpd.Startup(id), version)
  |> result.map_error(LgpdError)
}

/// Revoke LGPD (Lei Geral de Proteção de Dados) consent for a Startup at a
/// given policy version. Once revoked, the Startup no longer allows its data
/// to be used as described by that version of the privacy policy.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.revoke_lgpd_consent(context.database, id, version: 1)
///
/// case result {
///   Ok(lgpd.Revoked(..)) -> wisp.ok()
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn revoke_lgpd_consent(
  database: pog.Connection,
  id: uuid.Uuid,
  version version: Int,
) -> Result(lgpd.Consent, StartupError) {
  lgpd.revoke_consent(database, lgpd.Startup(id), version)
  |> result.map_error(LgpdError)
}

/// Convert a `Stage` into a String
fn stage_to_string(stage: Stage) -> String {
  case stage {
    Traction -> "traction"
    Scaling -> "scaling"
  }
}

/// Updates a Startup's information.
///
/// Passing `option.None` leaves a field unchanged. Empty strings are also
/// treated as "unchanged" by the underlying SQL query.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.update(
///   context.database,
///   id,
///   new_name: option.Some("Virada no Cafe"),
///   new_stage: option.Some(startup.Scaling),
///   new_email: option.None,
///   new_cnpj: option.None,
///   new_description: option.Some("Inovacao periferica que transforma"),
///   new_city: option.None,
///   new_state: option.None,
///   new_website: option.None,
/// )
///
/// case result {
///   Ok(startup) -> wisp.ok()
///   Error(startup.NotFound(..)) -> wisp.not_found()
///   Error(startup.CnpjConflict(..))
///   | Error(startup.EmailConflict(..)) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn update(
  database: pog.Connection,
  id: uuid.Uuid,
  new_name name: Option(String),
  new_stage stage: Option(Stage),
  new_email email: Option(email.Email),
  new_cnpj cnpj: Option(cnpj.Cnpj),
  new_description description: Option(String),
  new_city city: Option(String),
  new_state state: Option(String),
  new_website website: Option(uri.Uri),
) -> Result(Startup, StartupError) {
  let update_result =
    sql.update(
      database,
      id,
      option.unwrap(name, or: ""),
      option.unwrap(option.map(stage, stage_to_string), or: ""),
      option.unwrap(option.map(email, email.to_string), or: ""),
      option.unwrap(option.map(cnpj, cnpj.to_string), or: ""),
      option.unwrap(description, or: ""),
      option.unwrap(city, or: ""),
      option.unwrap(state, or: ""),
      option.unwrap(option.map(website, uri.to_string), or: ""),
    )

  // I'm not sure how an update can fail with a conflict while the key is
  // `option.None`, so I'm returning a generic `FailedToUpdateStartup` error.
  use returned <- result.try(case update_result {
    Error(pog.ConstraintViolated(constraint: "startup_cnpj_key", ..)) ->
      case cnpj {
        None -> Error(FailedToUpdateStartup(id))
        Some(cnpj) -> Error(CnpjConflict(value: cnpj))
      }

    // A CNPJ needs to have exactly 14 digits.
    Error(pog.ConstraintViolated(constraint: "startup_cnpj_check", ..)) ->
      case cnpj {
        None -> Error(FailedToUpdateStartup(id))
        Some(cnpj) -> Error(InvalidCnpj(value: cnpj.to_string(cnpj)))
      }

    // Every Startup Email needs to be unique.
    Error(pog.ConstraintViolated(constraint: "startup_email_key", ..)) ->
      case email {
        None -> Error(FailedToUpdateStartup(id))
        Some(email) -> Error(EmailConflict(value: email))
      }

    Ok(data) -> Ok(data)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id)),
  )

  use cnpj <- result.try(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  use email <- result.try(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  use website <- result.map(
    uri.parse(row.website)
    |> result.replace_error(InvalidWebsite(value: row.website)),
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
    updated_at: row.updated_at,
    is_active: row.is_active,
    website:,
  )
}

/// Accept a pending [Connection](connection.html#Connection) request from a
/// [Company](company.html#Company) and return the updated connection.
///
/// Only pending connections can be accepted: if the request does not exist,
/// or if it was already accepted or declined, `Error(ConnectionNotFound)` is
/// returned.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.accept_connection(
///   context.database,
///   startup.id,
///   from: company.id,
/// )
///
/// case result {
///   Ok(connection) -> wisp.ok()
///   Error(startup.ConnectionNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn accept_connection(
  database: pog.Connection,
  id: uuid.Uuid,
  from company: uuid.Uuid,
) -> Result(connection.Connection, StartupError) {
  use returned <- result.try(
    sql.accept_connection(database, company, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(ConnectionNotFound(company)),
  )

  let status = case row.connection_status {
    sql.Accepted -> connection.Accepted
    sql.Declined -> connection.Declined
    sql.Pending -> connection.Pending
  }

  connection.Connection(
    company: row.company_id,
    created_at: row.created_at,
    startup: row.startup_id,
    status:,
    updated_at: row.updated_at,
  )
}

/// Decline a pending [Connection](connection.html#Connection) request from a
/// [Company](company.html#Company) and return the updated connection.
///
/// Only pending connections can be declined: if the request does not exist,
/// or if it was already accepted or declined, `Error(ConnectionNotFound)` is
/// returned. A declined connection is kept in the Database, so the Company
/// cannot request it again.
///
/// ## Examples
///
/// ```gleam
/// let result = startup.decline_connection(
///   context.database,
///   startup.id,
///   from: company.id,
/// )
///
/// case result {
///   Ok(connection) -> wisp.ok()
///   Error(startup.ConnectionNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn decline_connection(
  database: pog.Connection,
  id: uuid.Uuid,
  from company: uuid.Uuid,
) -> Result(connection.Connection, StartupError) {
  use returned <- result.try(
    sql.decline_connection(database, company, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(ConnectionNotFound(company)),
  )

  let status = case row.connection_status {
    sql.Accepted -> connection.Accepted
    sql.Declined -> connection.Declined
    sql.Pending -> connection.Pending
  }

  connection.Connection(
    company: row.company_id,
    created_at: row.created_at,
    startup: row.startup_id,
    status:,
    updated_at: row.updated_at,
  )
}

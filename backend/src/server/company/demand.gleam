import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/company/demand/sql
import server/expertise
import server/internal
import server/segment
import server/service
import server/technology
import youid/uuid

pub type DemandError {
  /// Failed to query the Database
  DatabaseError(pog.QueryError)
  /// Demand was not found in the Database
  NotFound(uuid.Uuid)
  /// Tried to created a Demand for a Company that is not registered
  CompanyNotFound(uuid.Uuid)
  /// Something went wrong when registering a new Demand
  FailedToRegisterDemand
  /// Something went wrong when updating a Demand
  FailedToUpdateDemand(uuid.Uuid)

  // Assignment errors --------------------------------------------------------
  //
  /// Segment, technology, etc is already assigned
  AssignmentConflict(uuid.Uuid)
  /// Tried to assign an entity that is not registered
  AssignedMissingEntity(uuid.Uuid)
  /// Failed to assign entity to a demand for unknown reasons
  AssignmentFailure(uuid.Uuid)
  /// Failed to unassign entity from a demand for unknown reasons
  AssignmentNotFound(uuid.Uuid)
}

/// The lifecycle state of a Company's [Demand](#Demand).
pub type Status {
  /// The Company is accepting matches or proposals for this demand.
  Open
  /// The Company has finished the demand, either because it was fulfilled
  /// or because it is no longer accepting proposals.
  Closed
  /// The Company withdrew the demand before it was fulfilled.
  Canceled
}

fn status_to_json(status: Status) -> json.Json {
  case status {
    Open -> json.string("open")
    Closed -> json.string("closed")
    Canceled -> json.string("canceled")
  }
}

/// A technological solution requested by a [Company](#Company).
///
/// A demand describes what the Company is looking for.
pub type Demand {
  Demand(
    /// Unique identifier for the demand.
    id: uuid.Uuid,
    /// The Company that created the demand.
    company_id: uuid.Uuid,
    /// A short summary of what the Company needs.
    title: String,
    /// A detailed description of the problem, context, and requirements.
    description: String,
    /// Current lifecycle state of the demand.
    status: Status,
    /// Timestamp of when the demand was created.
    created_at: timestamp.Timestamp,
    /// Timestamp of when the demand was last updated.
    updated_at: timestamp.Timestamp,
  )
}

/// Encode a `Demand` into JSON
pub fn to_json(demand: Demand) -> json.Json {
  let Demand(
    id:,
    company_id:,
    title:,
    description:,
    status:,
    created_at:,
    updated_at:,
  ) = demand

  json.object([
    #("id", internal.uuid_to_json(id)),
    #("company_id", internal.uuid_to_json(company_id)),
    #("title", json.string(title)),
    #("description", json.string(description)),
    #("status", status_to_json(status)),
    #("created_at", internal.timestamp_to_json(created_at)),
    #("updated_at", internal.timestamp_to_json(updated_at)),
  ])
}

/// Search a Demand in the Database using their ID
///
/// ## Examples
///
/// ```gleam
/// let result = demand.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(demand.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Demand, DemandError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id)),
  )

  Demand(
    id: row.id,
    company_id: row.company_id,
    title: row.title,
    description: row.description,
    status: status_from_enum(row.demand_status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

fn status_from_enum(enum: sql.DemandStatus) -> Status {
  case enum {
    sql.Open -> Open
    sql.Closed -> Closed
    sql.Canceled -> Canceled
  }
}

/// Sometimes it can be a good idea to check if a Demand exists before
/// performing a query. This middleware returns `Error(NotFound(_))`
/// if a Demand is not registered.
pub fn ensure_exists(
  database: pog.Connection,
  id: uuid.Uuid,
  next: fn() -> Result(a, DemandError),
) -> Result(a, DemandError) {
  use returned <- result.try(
    sql.ensure_exists(database, id)
    |> result.map_error(DatabaseError),
  )

  case list.first(returned.rows) {
    Ok(_) -> next()
    Error(_) -> Error(NotFound(id))
  }
}

/// Get all segments that a Demand is assigned to.
pub fn get_segments(
  database: pog.Connection,
  from id: uuid.Uuid,
) -> Result(List(segment.Segment), DemandError) {
  use returned <- result.map(
    sql.get_segments(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    segment.Segment(id: row.id, name: row.name, description: row.description)
  })
}

/// Assign a Segment to a Demand and returns the assigned Segment if
/// successful. You cannot assign a segment to a demand more than once.
pub fn assign_segment(
  database: pog.Connection,
  id: uuid.Uuid,
  assign segment_id: uuid.Uuid,
) -> Result(segment.Segment, DemandError) {
  use returned <- result.try(case sql.assign_segment(database, id, segment_id) {
    Error(pog.ConstraintViolated(
      constraint: "demand_segment_demand_id_fkey",
      ..,
    )) -> Error(NotFound(id))

    Error(pog.ConstraintViolated(
      constraint: "demand_segment_segment_id_fkey",
      ..,
    )) -> Error(AssignedMissingEntity(segment_id))

    Error(pog.ConstraintViolated(constraint: "demand_segment_pkey", ..)) ->
      Error(AssignmentConflict(segment_id))

    Ok(rows) -> Ok(rows)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(segment_id)),
  )

  segment.Segment(id: row.id, name: row.name, description: row.description)
}

/// Unassign a segment from a Demand.
pub fn unassign_segment(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign segment_id: uuid.Uuid,
) -> Result(segment.Segment, DemandError) {
  use returned <- result.try(
    sql.unassign_segment(database, id, segment_id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(segment_id)),
  )

  segment.Segment(id: row.id, name: row.name, description: row.description)
}

/// Get all expertises that a Demand is assigned to
pub fn get_expertises(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(expertise.Expertise), DemandError) {
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

fn status_to_enum(status: Status) -> sql.DemandStatus {
  case status {
    Open -> sql.Open
    Closed -> sql.Closed
    Canceled -> sql.Canceled
  }
}

/// Register a new demand in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = demand.register(
///   context.database,
///   company_id: company_id,
///   title: "Need more gleam developers",
///   description: "A lot more of them",
///   status: demand.Open,
/// )
///
/// case result {
///   Ok(demand) -> wisp.response(201)
///   Error(demand.CompanyNotFound(..)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
///
pub fn register(
  database: pog.Connection,
  company_id company_id: uuid.Uuid,
  title title: String,
  description description: String,
  status status: Status,
) -> Result(Demand, DemandError) {
  let status = status_to_enum(status)

  use returned <- result.try(
    case sql.register(database, company_id, title, description, status) {
      Error(pog.ConstraintViolated(constraint: "demand_company_id_fkey", ..)) ->
        Error(CompanyNotFound(company_id))

      Ok(data) -> Ok(data)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterDemand),
  )

  Demand(
    id: row.id,
    company_id: row.company_id,
    title: row.title,
    description: row.description,
    status: status_from_enum(row.demand_status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

/// Assign an Expertise to a Demand and returns the assigned Expertise if
/// successful. You cannot assign the same expertise to a demand more
/// than once.
pub fn assign_expertise(
  database: pog.Connection,
  id: uuid.Uuid,
  assign expertise_id: uuid.Uuid,
) -> Result(expertise.Expertise, DemandError) {
  use returned <- result.try(
    case sql.assign_expertise(database, id, expertise_id) {
      Error(pog.ConstraintViolated(
        constraint: "demand_expertise_demand_id_fkey",
        ..,
      )) -> Error(NotFound(id))

      Error(pog.ConstraintViolated(
        constraint: "demand_expertise_expertise_id_fkey",
        ..,
      )) -> Error(AssignedMissingEntity(expertise_id))

      Error(pog.ConstraintViolated(constraint: "demand_expertise_pkey", ..)) ->
        Error(AssignmentConflict(expertise_id))

      Ok(rows) -> Ok(rows)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(expertise_id)),
  )

  expertise.Expertise(id: row.id, name: row.name, description: row.description)
}

/// Unassign an Expertise from a Demand.
pub fn unassign_expertise(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign expertise_id: uuid.Uuid,
) -> Result(expertise.Expertise, DemandError) {
  use returned <- result.try(
    sql.unassign_expertise(database, id, expertise_id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(expertise_id)),
  )

  expertise.Expertise(id: row.id, name: row.name, description: row.description)
}

/// Get all services that a Demand is assigned to
pub fn get_services(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(service.Service), DemandError) {
  use returned <- result.map(
    sql.get_services(database, id)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    service.Service(id: row.id, name: row.name, description: row.description)
  })
}

/// Assign a Service to a Demand and returns the assigned Service if
/// successful. You cannot assign a service to a demand more than once.
pub fn assign_service(
  database: pog.Connection,
  id: uuid.Uuid,
  assign service_id: uuid.Uuid,
) -> Result(service.Service, DemandError) {
  use returned <- result.try(case sql.assign_service(database, id, service_id) {
    Error(pog.ConstraintViolated(
      constraint: "demand_service_demand_id_fkey",
      ..,
    )) -> Error(NotFound(id))

    Error(pog.ConstraintViolated(
      constraint: "demand_service_service_id_fkey",
      ..,
    )) -> Error(AssignedMissingEntity(service_id))

    Error(pog.ConstraintViolated(constraint: "demand_service_pkey", ..)) ->
      Error(AssignmentConflict(service_id))

    Ok(rows) -> Ok(rows)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(service_id)),
  )

  service.Service(id: row.id, name: row.name, description: row.description)
}

/// Unassign a Service from a Demand.
pub fn unassign_service(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign service_id: uuid.Uuid,
) -> Result(service.Service, DemandError) {
  use returned <- result.try(
    sql.unassign_service(database, id, service_id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(service_id)),
  )

  service.Service(id: row.id, name: row.name, description: row.description)
}

/// Get all technologies that a Demand is assigned to
pub fn get_technologies(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(technology.Technology), DemandError) {
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

/// Assign a Technology to a Demand and returns the assigned Technology if
/// successful. You cannot assign a technology to a demand more than once.
pub fn assign_technology(
  database: pog.Connection,
  id: uuid.Uuid,
  assign technology_id: uuid.Uuid,
) -> Result(technology.Technology, DemandError) {
  use returned <- result.try(
    case sql.assign_technology(database, id, technology_id) {
      Error(pog.ConstraintViolated(
        constraint: "demand_technology_demand_id_fkey",
        ..,
      )) -> Error(NotFound(id))

      Error(pog.ConstraintViolated(
        constraint: "demand_technology_technology_id_fkey",
        ..,
      )) -> Error(AssignedMissingEntity(technology_id))

      Error(pog.ConstraintViolated(constraint: "demand_technology_pkey", ..)) ->
        Error(AssignmentConflict(technology_id))

      Ok(rows) -> Ok(rows)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentFailure(technology_id)),
  )

  technology.Technology(
    id: row.id,
    name: row.name,
    description: row.description,
  )
}

/// Unassign a Technology from a Demand.
pub fn unassign_technology(
  database: pog.Connection,
  id: uuid.Uuid,
  unassign technology_id: uuid.Uuid,
) -> Result(technology.Technology, DemandError) {
  use returned <- result.try(
    sql.unassign_technology(database, id, technology_id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(AssignmentNotFound(technology_id)),
  )

  technology.Technology(
    id: row.id,
    name: row.name,
    description: row.description,
  )
}

/// Update a Demand's status
fn do_update_status(
  database: pog.Connection,
  id: uuid.Uuid,
  to status: Status,
) -> Result(Demand, DemandError) {
  let status = status_to_enum(status)

  use returned <- result.try(
    sql.update_status(database, id, status)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToUpdateDemand(id)),
  )

  Demand(
    id: row.id,
    company_id: row.company_id,
    title: row.title,
    description: row.description,
    status: status_from_enum(row.demand_status),
    created_at: row.created_at,
    updated_at: row.updated_at,
  )
}

/// Update a Demand's status to `Open`
pub fn open(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Demand, DemandError) {
  do_update_status(database, id, to: Open)
}

/// Update a Demand's status to `Closed`
pub fn close(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Demand, DemandError) {
  do_update_status(database, id, to: Closed)
}

/// Update a Demand's status to `Canceled`
pub fn cancel(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Demand, DemandError) {
  do_update_status(database, id, to: Canceled)
}

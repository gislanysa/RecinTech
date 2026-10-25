import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/company/demand/sql
import youid/uuid

pub type DemandError {
  /// Failed to query the Database
  DatabaseError(pog.QueryError)
  /// Demand was not found in the Database
  NotFound(uuid.Uuid)
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

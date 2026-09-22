import gleam/list
import gleam/result
import pog
import server/segment/sql
import youid/uuid

pub type SegmentError {
  /// Failed to connect to the Database
  DatabaseError(error: pog.QueryError)
  /// Something went wrong when registering a Startup
  FailedToRegisterSegment
  /// Segment was not found in the Database
  NotFound(id: uuid.Uuid)
}

pub type Segment {
  Segment(
    /// Segment's ID
    id: uuid.Uuid,
    /// Segment's name
    name: String,
    /// A brief description
    description: String,
  )
}

/// Register a new segment in the Database.
///
/// ## Examples
///
/// ```gleam
/// let result = segment.register(context.database, name:, description:)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(segment.NotFound) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  name name: String,
  description description: String,
) -> Result(Segment, SegmentError) {
  use returned <- result.try(
    sql.register(database, name, description)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterSegment),
  )

  Segment(id: row.id, name: row.name, description: row.description)
}

/// Search a segment in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = segment.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(segment.NotFound) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Segment, SegmentError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  Segment(id: row.id, name: row.name, description: row.description)
}

//// Startup segments like technology, finances, biotechnology.

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import pog
import server/internal
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

/// A decoder that decodes `Segment` values.
pub fn decoder() -> decode.Decoder(Segment) {
  use id <- decode.field("id", internal.uuid_decoder())
  use name <- decode.field("name", decode.string)
  use description <- decode.field("description", decode.string)
  decode.success(Segment(id:, name:, description:))
}

/// Encode a Segment into a JSON object.
pub fn to_json(segment: Segment) -> json.Json {
  let Segment(id:, name:, description:) = segment
  json.object([
    #("id", internal.uuid_to_json(id)),
    #("name", json.string(name)),
    #("description", json.string(description)),
  ])
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

/// Fetch many Segments from the database, specifying the max number of
/// returned rows, and how many to skip.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   segment.get_many(context.database, limit: 3, offset: 6)
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
) -> Result(List(Segment), SegmentError) {
  use returned <- result.map(
    sql.get_many(database, limit, offset)
    |> result.map_error(DatabaseError),
  )

  list.map(returned.rows, fn(row) {
    Segment(id: row.id, name: row.name, description: row.description)
  })
}

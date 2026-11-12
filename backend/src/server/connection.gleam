//// Connections link [Companies](company.html#Company), the demand side of
//// RecInTech, to [Startups](startup.html#Startup), the supply side. A Company
//// requests a connection with a Startup, which can then accept or decline it.

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/connection/sql
import server/internal
import youid/uuid

pub type ConnectionError {
  /// Failed to query the Database
  DatabaseError(pog.QueryError)
  /// Connection not found
  NotFound
}

/// The state of a [Connection](#Connection).
pub type Status {
  /// The Company requested a connection, and the Startup has not responded
  /// yet.
  Pending
  /// The Startup accepted the Company's request.
  Accepted
  /// The Startup declined the Company's request.
  Declined
}

/// Encode a [Status](#Status) into JSON.
@internal
pub fn status_to_json(status: Status) -> json.Json {
  case status {
    Pending -> json.string("pending")
    Accepted -> json.string("accepted")
    Declined -> json.string("declined")
  }
}

/// A decoder that decodes [Status](#Status) values.
@internal
pub fn status_decoder() -> decode.Decoder(Status) {
  use variant <- decode.then(decode.string)
  case variant {
    "pending" -> decode.success(Pending)
    "accepted" -> decode.success(Accepted)
    "declined" -> decode.success(Declined)
    _ -> decode.failure(Pending, "Status")
  }
}

/// A connection between a [Company](company.html#Company) and a
/// [Startup](startup.html#Startup).
pub type Connection {
  Connection(
    /// The Company that requested the connection.
    company: uuid.Uuid,
    /// The Startup that received the request.
    startup: uuid.Uuid,
    /// The current state of the connection.
    status: Status,
    /// When the connection was requested.
    created_at: timestamp.Timestamp,
    /// When the connection was last updated, like when it was accepted or
    /// declined.
    updated_at: timestamp.Timestamp,
  )
}

/// A decoder that decodes `Connection` values.
pub fn decoder() -> decode.Decoder(Connection) {
  use company <- decode.field("company", internal.uuid_decoder())
  use startup <- decode.field("startup", internal.uuid_decoder())
  use status <- decode.field("status", status_decoder())
  use created_at <- decode.field("created_at", internal.timestamp_decoder())
  use updated_at <- decode.field("updated_at", internal.timestamp_decoder())

  decode.success(Connection(
    company:,
    startup:,
    status:,
    created_at:,
    updated_at:,
  ))
}

/// Encode a `Connection` into JSON.
pub fn to_json(connection: Connection) -> json.Json {
  let Connection(company:, startup:, status:, created_at:, updated_at:) =
    connection

  json.object([
    #("company", internal.uuid_to_json(company)),
    #("startup", internal.uuid_to_json(startup)),
    #("status", status_to_json(status)),
    #("created_at", internal.timestamp_to_json(created_at)),
    #("updated_at", internal.timestamp_to_json(updated_at)),
  ])
}

/// Delete the [Connection](#Connection) between a
/// [Company](company.html#Company) and a [Startup](startup.html#Startup) and
/// return the deleted connection.
///
/// A connection can be deleted no matter its [Status](#Status), and by either
/// side. The row is removed from the Database entirely, so, unlike
/// [declining](startup.html#decline_connection) a request, the Company can
/// request a new connection with the same Startup afterwards.
///
/// If there is no connection between the Company and the Startup,
/// `Error(NotFound)` is returned.
///
/// ## Examples
///
/// ```gleam
/// let result = connection.delete(
///   context.database,
///   company: company.id,
///   startup: startup.id,
/// )
///
/// case result {
///   Ok(connection) -> wisp.ok()
///   Error(connection.NotFound) -> wisp.not_found()
///   Error(connection.DatabaseError(_)) -> wisp.internal_server_error()
/// }
/// ```
pub fn delete(
  database: pog.Connection,
  company company: uuid.Uuid,
  startup startup: uuid.Uuid,
) -> Result(Connection, ConnectionError) {
  use returned <- result.try(
    sql.delete(database, company, startup)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(NotFound),
  )

  let status = case row.connection_status {
    sql.Accepted -> Accepted
    sql.Declined -> Declined
    sql.Pending -> Pending
  }

  Connection(
    company: row.company_id,
    created_at: row.created_at,
    startup: row.startup_id,
    status:,
    updated_at: row.updated_at,
  )
}

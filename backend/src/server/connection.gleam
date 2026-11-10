//// Connections link [Companies](company.html#Company), the demand side of
//// RecInTech, to [Startups](startup.html#Startup), the supply side. A Company
//// requests a connection with a Startup, which can then accept or decline it.

import gleam/time/timestamp
import youid/uuid

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

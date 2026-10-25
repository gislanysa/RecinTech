import gleam/time/timestamp
import youid/uuid

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

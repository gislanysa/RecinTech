import gleam/time/timestamp
import youid/uuid

pub type Status {
  Pending
  Accepted
  Declined
}

pub type Connection {
  Connection(
    status: Status,
    created_at: timestamp.Timestamp,
    updated_at: timestamp.Timestamp,
    company: uuid.Uuid,
    startup: uuid.Uuid,
  )
}

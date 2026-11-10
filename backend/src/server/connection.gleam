import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/connection/sql
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

pub type ConnectionError {
  DatabaseError(pog.QueryError)
  CompanyNotFound(uuid.Uuid)
  StartupNotFound(uuid.Uuid)
  ConnectionNotFound
  ConnectionConflict(startup_id: uuid.Uuid)
  ConnectionNotPending
  FailedToCreateConnection(startup_id: uuid.Uuid)
}

pub fn request(
  database: pog.Connection,
  from company: uuid.Uuid,
  to startup: uuid.Uuid,
) -> Result(Connection, ConnectionError) {
  use returned <- result.try(case sql.request(database, company, startup) {
    Error(pog.ConstraintViolated(
      constraint: "company_startup_connection_company_id_fkey",
      ..,
    )) -> Error(CompanyNotFound(company))

    Error(pog.ConstraintViolated(
      constraint: "company_startup_connection_startup_id_fkey",
      ..,
    )) -> Error(StartupNotFound(company))

    Error(pog.ConstraintViolated(
      constraint: "company_startup_connection_pkey",
      ..,
    )) -> Error(ConnectionConflict(startup))

    Ok(data) -> Ok(data)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToCreateConnection(startup)),
  )

  Connection(
    company: row.company_id,
    created_at: row.created_at,
    startup: row.startup_id,
    status: status_from_enum(row.connection_status),
    updated_at: row.updated_at,
  )
}

fn status_from_enum(enum: sql.ConnectionStatusEnum) -> Status {
  case enum {
    sql.Accepted -> Accepted
    sql.Declined -> Declined
    sql.Pending -> Pending
  }
}

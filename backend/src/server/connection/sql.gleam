//// This module contains the code to run the sql queries defined in
//// `./src/server/connection/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `request` query
/// defined in `./src/server/connection/sql/request.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RequestRow {
  RequestRow(
    company_id: Uuid,
    startup_id: Uuid,
    connection_status: ConnectionStatusEnum,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// send a new connection request
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn request(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(RequestRow), pog.QueryError) {
  let decoder = {
    use company_id <- decode.field(0, uuid_decoder())
    use startup_id <- decode.field(1, uuid_decoder())
    use connection_status <- decode.field(2, connection_status_enum_decoder())
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use updated_at <- decode.field(4, pog.timestamp_decoder())
    decode.success(RequestRow(
      company_id:,
      startup_id:,
      connection_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- send a new connection request
INSERT INTO
    company_startup_connection (company_id, startup_id)
VALUES
    ($1::uuid, $2::uuid)
RETURNING
    company_id,
    startup_id,
    connection_status,
    created_at,
    updated_at;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `connection_status_enum` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type ConnectionStatusEnum {
  Declined
  Accepted
  Pending
}

fn connection_status_enum_decoder() -> decode.Decoder(ConnectionStatusEnum) {
  use connection_status_enum <- decode.then(decode.string)
  case connection_status_enum {
    "declined" -> decode.success(Declined)
    "accepted" -> decode.success(Accepted)
    "pending" -> decode.success(Pending)
    _ -> decode.failure(Declined, "ConnectionStatusEnum")
  }
}

// --- Encoding/decoding utils -------------------------------------------------

/// A decoder to decode `Uuid`s coming from a Postgres query.
///
fn uuid_decoder() {
  use bit_array <- decode.then(decode.bit_array)
  case uuid.from_bit_array(bit_array) {
    Ok(uuid) -> decode.success(uuid)
    Error(_) -> decode.failure(uuid.v7(), "Uuid")
  }
}

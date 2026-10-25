//// This module contains the code to run the sql queries defined in
//// `./src/server/company/demand/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get` query
/// defined in `./src/server/company/demand/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    company_id: Uuid,
    title: String,
    description: String,
    demand_status: DemandStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// find a demand by its ID
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use company_id <- decode.field(1, uuid_decoder())
    use title <- decode.field(2, decode.string)
    use description <- decode.field(3, decode.string)
    use demand_status <- decode.field(4, demand_status_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(GetRow(
      id:,
      company_id:,
      title:,
      description:,
      demand_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- find a demand by its ID
SELECT
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at
FROM
    demand
WHERE
    demand.id = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `demand_status` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DemandStatus {
  Canceled
  Closed
  Open
}

fn demand_status_decoder() -> decode.Decoder(DemandStatus) {
  use demand_status <- decode.then(decode.string)
  case demand_status {
    "canceled" -> decode.success(Canceled)
    "closed" -> decode.success(Closed)
    "open" -> decode.success(Open)
    _ -> decode.failure(Canceled, "DemandStatus")
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

//// This module contains the code to run the sql queries defined in
//// `./src/server/investor/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get` query
/// defined in `./src/server/investor/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    kind: InvestorKind,
    public_profile: Bool,
    full_name: String,
    email: String,
    created_at: Timestamp,
    is_active: Bool,
  )
}

/// select an investor from the database
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
    use kind <- decode.field(1, investor_kind_decoder())
    use public_profile <- decode.field(2, decode.bool)
    use full_name <- decode.field(3, decode.string)
    use email <- decode.field(4, decode.string)
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use is_active <- decode.field(6, decode.bool)
    decode.success(GetRow(
      id:,
      kind:,
      public_profile:,
      full_name:,
      email:,
      created_at:,
      is_active:,
    ))
  }

  "-- select an investor from the database
SELECT
    i.id,
    i.kind,
    i.public_profile,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active
FROM
    investor AS i
    INNER JOIN user_account AS u ON i.id = u.id
WHERE
    i.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `investor_kind` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type InvestorKind {
  Institutional
  Individual
  Venture
  Angel
}

fn investor_kind_decoder() -> decode.Decoder(InvestorKind) {
  use investor_kind <- decode.then(decode.string)
  case investor_kind {
    "institutional" -> decode.success(Institutional)
    "individual" -> decode.success(Individual)
    "venture" -> decode.success(Venture)
    "angel" -> decode.success(Angel)
    _ -> decode.failure(Institutional, "InvestorKind")
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

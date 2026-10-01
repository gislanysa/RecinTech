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
    name: String,
    email: String,
    kind: InvestorKind,
    public_profile: Bool,
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
    use name <- decode.field(1, decode.string)
    use email <- decode.field(2, decode.string)
    use kind <- decode.field(3, investor_kind_decoder())
    use public_profile <- decode.field(4, decode.bool)
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use is_active <- decode.field(6, decode.bool)
    decode.success(GetRow(
      id:,
      name:,
      email:,
      kind:,
      public_profile:,
      created_at:,
      is_active:,
    ))
  }

  "-- select an investor from the database
SELECT
    i.id,
    i.name,
    i.email,
    i.kind,
    i.public_profile,
    i.created_at,
    i.is_active
FROM
    investor AS i
WHERE
    i.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_credentials` query
/// defined in `./src/server/investor/sql/get_credentials.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetCredentialsRow {
  GetCredentialsRow(id: Uuid, password_hash: String)
}

/// select investor id and credentials
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_credentials(
  db: pog.Connection,
  arg_1: String,
) -> Result(pog.Returned(GetCredentialsRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use password_hash <- decode.field(1, decode.string)
    decode.success(GetCredentialsRow(id:, password_hash:))
  }

  "-- select investor id and credentials
SELECT
    i.id,
    i.password_hash
FROM
    public.investor AS i
WHERE
    i.email = $1::text;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
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

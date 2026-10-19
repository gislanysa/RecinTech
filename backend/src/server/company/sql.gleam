//// This module contains the code to run the sql queries defined in
//// `./src/server/company/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get` query
/// defined in `./src/server/company/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    name: String,
    email: String,
    size: CompanySize,
    cnpj: String,
    city: String,
    state: String,
    is_active: Bool,
    created_at: Timestamp,
    website: String,
  )
}

/// select a company from the database
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
    use size <- decode.field(3, company_size_decoder())
    use cnpj <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use is_active <- decode.field(7, decode.bool)
    use created_at <- decode.field(8, pog.timestamp_decoder())
    use website <- decode.field(9, decode.string)
    decode.success(GetRow(
      id:,
      name:,
      email:,
      size:,
      cnpj:,
      city:,
      state:,
      is_active:,
      created_at:,
      website:,
    ))
  }

  "-- select a company from the database
SELECT
    c.id,
    c.name,
    c.email,
    c.size,
    c.cnpj,
    c.city,
    c.state,
    c.is_active,
    c.created_at,
    c.website
FROM
    public.company AS c
WHERE
    c.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_credentials` query
/// defined in `./src/server/company/sql/get_credentials.sql`.
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
    public.company AS i
WHERE
    i.email = $1::text;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `company_size` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type CompanySize {
  Big
  Medium
  Small
  Micro
}

fn company_size_decoder() -> decode.Decoder(CompanySize) {
  use company_size <- decode.then(decode.string)
  case company_size {
    "big" -> decode.success(Big)
    "medium" -> decode.success(Medium)
    "small" -> decode.success(Small)
    "micro" -> decode.success(Micro)
    _ -> decode.failure(Big, "CompanySize")
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

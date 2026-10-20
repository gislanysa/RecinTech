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

/// select company id and credentials
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

  "-- select company id and credentials
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

/// A row you get from running the `get_lgpd_consent` query
/// defined in `./src/server/company/sql/get_lgpd_consent.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetLgpdConsentRow {
  GetLgpdConsentRow(
    company_id: Uuid,
    consent: LgpdConsent,
    policy_version: Int,
    updated_at: Timestamp,
  )
}

/// query the lgpd consent of a company
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_lgpd_consent(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetLgpdConsentRow), pog.QueryError) {
  let decoder = {
    use company_id <- decode.field(0, uuid_decoder())
    use consent <- decode.field(1, lgpd_consent_decoder())
    use policy_version <- decode.field(2, decode.int)
    use updated_at <- decode.field(3, pog.timestamp_decoder())
    decode.success(GetLgpdConsentRow(
      company_id:,
      consent:,
      policy_version:,
      updated_at:,
    ))
  }

  "-- query the lgpd consent of a company
SELECT
    cl.company_id,
    cl.consent,
    cl.policy_version,
    cl.updated_at
FROM
    public.company_lgpd_consent AS cl
WHERE
    cl.company_id = $1::uuid
ORDER BY
    policy_version::integer;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `register` query
/// defined in `./src/server/company/sql/register.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RegisterRow {
  RegisterRow(
    id: Uuid,
    name: String,
    size: CompanySize,
    email: String,
    cnpj: String,
    city: String,
    state: String,
    created_at: Timestamp,
    is_active: Bool,
    website: String,
  )
}

/// register a new company on the database
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn register(
  db: pog.Connection,
  arg_1: String,
  arg_2: CompanySize,
  arg_3: String,
  arg_4: String,
  arg_5: String,
  arg_6: String,
  arg_7: String,
  arg_8: String,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use size <- decode.field(2, company_size_decoder())
    use email <- decode.field(3, decode.string)
    use cnpj <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    use is_active <- decode.field(8, decode.bool)
    use website <- decode.field(9, decode.string)
    decode.success(RegisterRow(
      id:,
      name:,
      size:,
      email:,
      cnpj:,
      city:,
      state:,
      created_at:,
      is_active:,
      website:,
    ))
  }

  "-- register a new company on the database
INSERT INTO
    public.company (
        name,
        size,
        email,
        cnpj,
        password_hash,
        city,
        state,
        website
    )
VALUES
    (
        $1::text,
        $2::company_size,
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text
    )
RETURNING
    id::uuid,
    name::text,
    size::company_size,
    email::text,
    cnpj::text,
    city::text,
    state::text,
    created_at,
    is_active::boolean,
    website::text;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(company_size_encoder(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(pog.text(arg_4))
  |> pog.parameter(pog.text(arg_5))
  |> pog.parameter(pog.text(arg_6))
  |> pog.parameter(pog.text(arg_7))
  |> pog.parameter(pog.text(arg_8))
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

fn company_size_encoder(company_size) -> pog.Value {
  case company_size {
    Big -> "big"
    Medium -> "medium"
    Small -> "small"
    Micro -> "micro"
  }
  |> pog.text
}

/// Corresponds to the Postgres `lgpd_consent` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type LgpdConsent {
  Revoked
  Granted
}

fn lgpd_consent_decoder() -> decode.Decoder(LgpdConsent) {
  use lgpd_consent <- decode.then(decode.string)
  case lgpd_consent {
    "revoked" -> decode.success(Revoked)
    "granted" -> decode.success(Granted)
    _ -> decode.failure(Revoked, "LgpdConsent")
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

//// This module contains the code to run the sql queries defined in
//// `./src/server/lgpd/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `update_investor_consent` query
/// defined in `./src/server/lgpd/sql/update_investor_consent.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateInvestorConsentRow {
  UpdateInvestorConsentRow(
    investor_id: Uuid,
    updated_at: Timestamp,
    policy_version: Int,
  )
}

/// grant consent to lgpd
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_investor_consent(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: LgpdConsent,
  arg_3: Int,
) -> Result(pog.Returned(UpdateInvestorConsentRow), pog.QueryError) {
  let decoder = {
    use investor_id <- decode.field(0, uuid_decoder())
    use updated_at <- decode.field(1, pog.timestamp_decoder())
    use policy_version <- decode.field(2, decode.int)
    decode.success(UpdateInvestorConsentRow(
      investor_id:,
      updated_at:,
      policy_version:,
    ))
  }

  "-- grant consent to lgpd
INSERT INTO
    investor_lgpd_consent (investor_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    )
RETURNING
    investor_id::uuid,
    updated_at::timestamp,
    policy_version::integer;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(lgpd_consent_encoder(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_startup_consent` query
/// defined in `./src/server/lgpd/sql/update_startup_consent.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateStartupConsentRow {
  UpdateStartupConsentRow(
    startup_id: Uuid,
    updated_at: Timestamp,
    policy_version: Int,
  )
}

/// grant consent to lgpd
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_startup_consent(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: LgpdConsent,
  arg_3: Int,
) -> Result(pog.Returned(UpdateStartupConsentRow), pog.QueryError) {
  let decoder = {
    use startup_id <- decode.field(0, uuid_decoder())
    use updated_at <- decode.field(1, pog.timestamp_decoder())
    use policy_version <- decode.field(2, decode.int)
    decode.success(UpdateStartupConsentRow(
      startup_id:,
      updated_at:,
      policy_version:,
    ))
  }

  "-- grant consent to lgpd
INSERT INTO
    startup_lgpd_consent (startup_id, consent, policy_version, updated_at)
VALUES
    (
        $1::uuid,
        $2::lgpd_consent,
        $3::integer,
        CURRENT_TIMESTAMP::timestamp
    )
RETURNING
    startup_id::uuid,
    updated_at::timestamp,
    policy_version::integer;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(lgpd_consent_encoder(arg_2))
  |> pog.parameter(pog.int(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `lgpd_consent` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type LgpdConsent {
  Revoked
  Granted
}

fn lgpd_consent_encoder(lgpd_consent) -> pog.Value {
  case lgpd_consent {
    Revoked -> "revoked"
    Granted -> "granted"
  }
  |> pog.text
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

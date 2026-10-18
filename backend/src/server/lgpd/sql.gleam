//// This module contains the code to run the sql queries defined in
//// `./src/server/lgpd/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog
import youid/uuid.{type Uuid}

/// grant consent to lgpd
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn grant_investor_consent(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "-- grant consent to lgpd
INSERT INTO
    investor_lgpd_consent (investor_id, granted, policy_version)
VALUES
    ($1::uuid, TRUE, $2::integer);
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// grant consent to lgpd
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn grant_startup_consent(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Int,
) -> Result(pog.Returned(Nil), pog.QueryError) {
  let decoder = decode.map(decode.dynamic, fn(_) { Nil })

  "-- grant consent to lgpd
INSERT INTO
    startup_lgpd_consent (startup_id, granted, policy_version)
VALUES
    ($1::uuid, TRUE, $2::integer);
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.int(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

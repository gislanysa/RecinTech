//// This module contains the code to run the sql queries defined in
//// `./src/server/user/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get` query
/// defined in `./src/server/user/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    full_name: String,
    email: String,
    created_at: Timestamp,
    is_active: Bool,
  )
}

/// select an user;
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
    use full_name <- decode.field(1, decode.string)
    use email <- decode.field(2, decode.string)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use is_active <- decode.field(4, decode.bool)
    decode.success(GetRow(id:, full_name:, email:, created_at:, is_active:))
  }

  "-- select an user;
SELECT
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active
FROM
    public.user_account AS u
WHERE
    u.id = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_credentials` query
/// defined in `./src/server/user/sql/get_credentials.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetCredentialsRow {
  GetCredentialsRow(id: Uuid, password_hash: String)
}

/// select user id and credentials
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

  "-- select user id and credentials
SELECT
    u.id,
    u.password_hash
FROM
    public.user_account AS u
WHERE
    u.email = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `register` query
/// defined in `./src/server/user/sql/register.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RegisterRow {
  RegisterRow(
    id: Uuid,
    full_name: String,
    email: String,
    created_at: Timestamp,
    is_active: Bool,
  )
}

/// register a new user
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn register(
  db: pog.Connection,
  arg_1: String,
  arg_2: String,
  arg_3: String,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use full_name <- decode.field(1, decode.string)
    use email <- decode.field(2, decode.string)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use is_active <- decode.field(4, decode.bool)
    decode.success(RegisterRow(id:, full_name:, email:, created_at:, is_active:))
  }

  "-- register a new user
INSERT INTO
    public.user_account AS u (
        full_name,
        email,
        password_hash
    )
VALUES
    ($1, $2, $3)
RETURNING
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
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

//// This module contains the code to run the sql queries defined in
//// `./src/server/startup/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `assign_members` query
/// defined in `./src/server/startup/sql/assign_members.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignMembersRow {
  AssignMembersRow(user_id: Uuid)
}

/// Assign members to a startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_members(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: List(Uuid),
) -> Result(pog.Returned(AssignMembersRow), pog.QueryError) {
  let decoder = {
    use user_id <- decode.field(0, uuid_decoder())
    decode.success(AssignMembersRow(user_id:))
  }

  "-- Assign members to a startup
INSERT INTO
    public.startup_membership (startup_id, user_id)
SELECT
    $1 AS startup_id,
    unnest($2::uuid []) AS user_id ON conflict (startup_id, user_id) DO nothing
RETURNING
    user_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(
    pog.array(fn(value) { pog.text(uuid.to_string(value)) }, arg_2),
  )
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get` query
/// defined in `./src/server/startup/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    segment_id: Uuid,
    name: String,
    cnpj: String,
    description: String,
    city: String,
    state: String,
    created_at: Timestamp,
  )
}

/// select an startup;
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
    use segment_id <- decode.field(1, uuid_decoder())
    use name <- decode.field(2, decode.string)
    use cnpj <- decode.field(3, decode.string)
    use description <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(GetRow(
      id:,
      segment_id:,
      name:,
      cnpj:,
      description:,
      city:,
      state:,
      created_at:,
    ))
  }

  "-- select an startup;
SELECT
    s.id,
    s.segment_id,
    s.name,
    s.cnpj,
    s.description,
    s.city,
    s.state,
    s.created_at
FROM
    public.startup AS s
WHERE
    s.id = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_members` query
/// defined in `./src/server/startup/sql/get_members.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetMembersRow {
  GetMembersRow(
    id: Uuid,
    full_name: String,
    email: String,
    created_at: Timestamp,
    is_active: Bool,
  )
}

/// get all members assigned to a given startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_members(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetMembersRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use full_name <- decode.field(1, decode.string)
    use email <- decode.field(2, decode.string)
    use created_at <- decode.field(3, pog.timestamp_decoder())
    use is_active <- decode.field(4, decode.bool)
    decode.success(GetMembersRow(
      id:,
      full_name:,
      email:,
      created_at:,
      is_active:,
    ))
  }

  "-- get all members assigned to a given startup
SELECT
    u.id,
    u.full_name,
    u.email,
    u.created_at,
    u.is_active
FROM
    public.user_account AS u
    INNER JOIN public.startup_membership AS sm ON sm.user_id = u.id
WHERE
    sm.startup_id = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `register` query
/// defined in `./src/server/startup/sql/register.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RegisterRow {
  RegisterRow(
    id: Uuid,
    segment_id: Uuid,
    name: String,
    cnpj: String,
    description: String,
    city: String,
    state: String,
    created_at: Timestamp,
  )
}

/// register a new startup on the database
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn register(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: String,
  arg_3: String,
  arg_4: String,
  arg_5: String,
  arg_6: String,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use segment_id <- decode.field(1, uuid_decoder())
    use name <- decode.field(2, decode.string)
    use cnpj <- decode.field(3, decode.string)
    use description <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(RegisterRow(
      id:,
      segment_id:,
      name:,
      cnpj:,
      description:,
      city:,
      state:,
      created_at:,
    ))
  }

  "-- register a new startup on the database
INSERT INTO
    public.startup (
        segment_id,
        name,
        cnpj,
        description,
        city,
        state
    )
VALUES
    ($1, $2, $3, $4, $5, $6)
RETURNING
    id,
    segment_id,
    name,
    cnpj,
    description,
    city,
    state,
    created_at;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(pog.text(arg_4))
  |> pog.parameter(pog.text(arg_5))
  |> pog.parameter(pog.text(arg_6))
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

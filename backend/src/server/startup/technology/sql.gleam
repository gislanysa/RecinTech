//// This module contains the code to run the sql queries defined in
//// `./src/server/startup/technology/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `get` query
/// defined in `./src/server/startup/technology/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(id: Uuid, name: String, description: String)
}

/// find a technology by its id
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
    use description <- decode.field(2, decode.string)
    decode.success(GetRow(id:, name:, description:))
  }

  "-- find a technology by its id
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.technology AS s
WHERE
    s.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `register` query
/// defined in `./src/server/startup/technology/sql/register.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RegisterRow {
  RegisterRow(id: Uuid, name: String, description: String)
}

/// register a new startup technology
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn register(
  db: pog.Connection,
  arg_1: String,
  arg_2: String,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(RegisterRow(id:, name:, description:))
  }

  "-- register a new startup technology
INSERT INTO
    public.technology (name, description)
VALUES
    ($1::text, $2::text)
RETURNING
    id,
    name,
    description;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(pog.text(arg_2))
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

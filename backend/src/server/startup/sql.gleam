//// This module contains the code to run the sql queries defined in
//// `./src/server/startup/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `assign_expertise` query
/// defined in `./src/server/startup/sql/assign_expertise.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignExpertiseRow {
  AssignExpertiseRow(expertise_id: Uuid)
}

/// Assign an expertise to a startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_expertise(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(AssignExpertiseRow), pog.QueryError) {
  let decoder = {
    use expertise_id <- decode.field(0, uuid_decoder())
    decode.success(AssignExpertiseRow(expertise_id:))
  }

  "-- Assign an expertise to a startup
INSERT INTO
    public.startup_expertise (startup_id, expertise_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS expertise_id
RETURNING
    expertise_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_member` query
/// defined in `./src/server/startup/sql/assign_member.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignMemberRow {
  AssignMemberRow(user_id: Uuid)
}

/// Assign members to a startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_member(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(AssignMemberRow), pog.QueryError) {
  let decoder = {
    use user_id <- decode.field(0, uuid_decoder())
    decode.success(AssignMemberRow(user_id:))
  }

  "-- Assign members to a startup
INSERT INTO
    public.startup_membership (startup_id, user_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS user_id
RETURNING
    user_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_segment` query
/// defined in `./src/server/startup/sql/assign_segment.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignSegmentRow {
  AssignSegmentRow(segment_id: Uuid)
}

/// assign a given Segment to a Startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_segment(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
  arg_3: Bool,
) -> Result(pog.Returned(AssignSegmentRow), pog.QueryError) {
  let decoder = {
    use segment_id <- decode.field(0, uuid_decoder())
    decode.success(AssignSegmentRow(segment_id:))
  }

  "-- assign a given Segment to a Startup
INSERT INTO
    public.startup_segment (startup_id, segment_id, is_main_segment)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS segment_id,
    $3::boolean AS is_main_segment
RETURNING
    segment_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.parameter(pog.bool(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_service` query
/// defined in `./src/server/startup/sql/assign_service.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignServiceRow {
  AssignServiceRow(service_id: Uuid)
}

/// Assign a service to a Startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_service(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(AssignServiceRow), pog.QueryError) {
  let decoder = {
    use service_id <- decode.field(0, uuid_decoder())
    decode.success(AssignServiceRow(service_id:))
  }

  "-- Assign a service to a Startup
INSERT INTO
    public.startup_service (startup_id, service_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS service_id
RETURNING
    service_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_technology` query
/// defined in `./src/server/startup/sql/assign_technology.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignTechnologyRow {
  AssignTechnologyRow(technology_id: Uuid)
}

/// Assign a startup to a technology
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_technology(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(AssignTechnologyRow), pog.QueryError) {
  let decoder = {
    use technology_id <- decode.field(0, uuid_decoder())
    decode.success(AssignTechnologyRow(technology_id:))
  }

  "-- Assign a startup to a technology
INSERT INTO
    public.startup_technology (startup_id, technology_id)
SELECT
    $1::uuid AS startup_id,
    $2::uuid AS technology_id
RETURNING
    technology_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `ensure_exists` query
/// defined in `./src/server/startup/sql/ensure_exists.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type EnsureExistsRow {
  EnsureExistsRow(found: Int)
}

/// return a single column if the given startup exists
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn ensure_exists(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(EnsureExistsRow), pog.QueryError) {
  let decoder = {
    use found <- decode.field(0, decode.int)
    decode.success(EnsureExistsRow(found:))
  }

  "-- return a single column if the given startup exists
SELECT
    1 AS found
FROM
    startup AS s
WHERE
    s.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
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
    name: String,
    stage: StartupStage,
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
    use name <- decode.field(1, decode.string)
    use stage <- decode.field(2, startup_stage_decoder())
    use cnpj <- decode.field(3, decode.string)
    use description <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(GetRow(
      id:,
      name:,
      stage:,
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
    s.name,
    s.stage,
    s.cnpj,
    s.description,
    s.city,
    s.state,
    s.created_at
FROM
    public.startup AS s
WHERE
    s.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_expertises` query
/// defined in `./src/server/startup/sql/get_expertises.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetExpertisesRow {
  GetExpertisesRow(id: Uuid, name: String, description: String)
}

/// get all expertises that a given startup is assigned to
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_expertises(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetExpertisesRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(GetExpertisesRow(id:, name:, description:))
  }

  "-- get all expertises that a given startup is assigned to
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN public.startup_expertise AS se ON se.expertise_id = e.id
WHERE
    se.startup_id = $1::uuid;
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
    sm.startup_id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_segments` query
/// defined in `./src/server/startup/sql/get_segments.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetSegmentsRow {
  GetSegmentsRow(id: Uuid, name: String, description: String)
}

/// select all segments from a startup
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_segments(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetSegmentsRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(GetSegmentsRow(id:, name:, description:))
  }

  "-- select all segments from a startup
SELECT
    s.id,
    s.name,
    s.description
FROM
    segment AS s
    INNER JOIN startup_segment AS ss ON ss.segment_id = s.id
WHERE
    ss.startup_id = $1::uuid;
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
    name: String,
    stage: StartupStage,
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
  arg_1: String,
  arg_2: StartupStage,
  arg_3: String,
  arg_4: String,
  arg_5: String,
  arg_6: String,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use stage <- decode.field(2, startup_stage_decoder())
    use cnpj <- decode.field(3, decode.string)
    use description <- decode.field(4, decode.string)
    use city <- decode.field(5, decode.string)
    use state <- decode.field(6, decode.string)
    use created_at <- decode.field(7, pog.timestamp_decoder())
    decode.success(RegisterRow(
      id:,
      name:,
      stage:,
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
        name,
        stage,
        cnpj,
        description,
        city,
        state
    )
VALUES
    (
        $1::text,
        $2::startup_stage,
        $3::text,
        $4::text,
        $5::text,
        $6::text
    )
RETURNING
    id,
    name,
    stage,
    cnpj,
    description,
    city,
    state,
    created_at;
"
  |> pog.query
  |> pog.parameter(pog.text(arg_1))
  |> pog.parameter(startup_stage_encoder(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(pog.text(arg_4))
  |> pog.parameter(pog.text(arg_5))
  |> pog.parameter(pog.text(arg_6))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `startup_stage` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type StartupStage {
  Growth
  Seed
}

fn startup_stage_decoder() -> decode.Decoder(StartupStage) {
  use startup_stage <- decode.then(decode.string)
  case startup_stage {
    "growth" -> decode.success(Growth)
    "seed" -> decode.success(Seed)
    _ -> decode.failure(Growth, "StartupStage")
  }
}

fn startup_stage_encoder(startup_stage) -> pog.Value {
  case startup_stage {
    Growth -> "growth"
    Seed -> "seed"
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

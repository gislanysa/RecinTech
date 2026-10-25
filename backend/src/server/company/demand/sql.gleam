//// This module contains the code to run the sql queries defined in
//// `./src/server/company/demand/sql`.
//// > 🐿️ This module was generated automatically using v4.7.0 of
//// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
////

import gleam/dynamic/decode
import gleam/time/timestamp.{type Timestamp}
import pog
import youid/uuid.{type Uuid}

/// A row you get from running the `assign_expertise` query
/// defined in `./src/server/company/demand/sql/assign_expertise.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignExpertiseRow {
  AssignExpertiseRow(id: Uuid, name: String, description: String)
}

/// Assign an expertise to a demand
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
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(AssignExpertiseRow(id:, name:, description:))
  }

  "-- Assign an expertise to a demand
WITH assigned AS (
    INSERT INTO
        public.demand_expertise (demand_id, expertise_id)
    SELECT
        $1::uuid AS demand_id,
        $2::uuid AS expertise_id
    RETURNING
        expertise_id
)
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN assigned AS a ON a.expertise_id = e.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_segment` query
/// defined in `./src/server/company/demand/sql/assign_segment.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignSegmentRow {
  AssignSegmentRow(id: Uuid, name: String, description: String)
}

/// assign a given Segment to a Demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn assign_segment(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: Uuid,
) -> Result(pog.Returned(AssignSegmentRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(AssignSegmentRow(id:, name:, description:))
  }

  "-- assign a given Segment to a Demand
WITH assigned AS (
    INSERT INTO
        public.demand_segment (demand_id, segment_id)
    SELECT
        $1::uuid AS demand_id,
        $2::uuid AS segment_id
    RETURNING
        segment_id
)
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.segment AS s
    INNER JOIN assigned AS a ON a.segment_id = s.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_service` query
/// defined in `./src/server/company/demand/sql/assign_service.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignServiceRow {
  AssignServiceRow(id: Uuid, name: String, description: String)
}

/// Assign a service to a Demand
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
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(AssignServiceRow(id:, name:, description:))
  }

  "-- Assign a service to a Demand
WITH assigned AS (
    INSERT INTO
        public.demand_service (demand_id, service_id)
    SELECT
        $1::uuid AS demand_id,
        $2::uuid AS service_id
    RETURNING
        service_id
)
SELECT
    s.id,
    s.name,
    s.description
FROM
    public.service AS s
    INNER JOIN assigned AS a ON a.service_id = s.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `assign_technology` query
/// defined in `./src/server/company/demand/sql/assign_technology.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type AssignTechnologyRow {
  AssignTechnologyRow(id: Uuid, name: String, description: String)
}

/// Assign a demand to a technology
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
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(AssignTechnologyRow(id:, name:, description:))
  }

  "-- Assign a demand to a technology
WITH assigned AS (
    INSERT INTO
        public.demand_technology (demand_id, technology_id)
    SELECT
        $1::uuid AS demand_id,
        $2::uuid AS technology_id
    RETURNING
        technology_id
)
SELECT
    t.id,
    t.name,
    t.description
FROM
    public.technology AS t
    INNER JOIN assigned AS a ON a.technology_id = t.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(uuid.to_string(arg_2)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `ensure_exists` query
/// defined in `./src/server/company/demand/sql/ensure_exists.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type EnsureExistsRow {
  EnsureExistsRow(found: Int)
}

/// return a single column if the given demand exists
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

  "-- return a single column if the given demand exists
SELECT
    1 AS found
FROM
    demand AS d
WHERE
    d.id = $1::uuid;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get` query
/// defined in `./src/server/company/demand/sql/get.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetRow {
  GetRow(
    id: Uuid,
    company_id: Uuid,
    title: String,
    description: String,
    demand_status: DemandStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// find a demand by its ID
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
    use company_id <- decode.field(1, uuid_decoder())
    use title <- decode.field(2, decode.string)
    use description <- decode.field(3, decode.string)
    use demand_status <- decode.field(4, demand_status_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(GetRow(
      id:,
      company_id:,
      title:,
      description:,
      demand_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- find a demand by its ID
SELECT
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at
FROM
    demand
WHERE
    demand.id = $1;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_expertises` query
/// defined in `./src/server/company/demand/sql/get_expertises.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetExpertisesRow {
  GetExpertisesRow(id: Uuid, name: String, description: String)
}

/// get all expertises that a given demand is assigned to
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

  "-- get all expertises that a given demand is assigned to
SELECT
    e.id,
    e.name,
    e.description
FROM
    public.expertise AS e
    INNER JOIN public.demand_expertise AS de ON de.expertise_id = e.id
WHERE
    de.demand_id = $1::uuid
ORDER BY
    e.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_segments` query
/// defined in `./src/server/company/demand/sql/get_segments.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetSegmentsRow {
  GetSegmentsRow(id: Uuid, name: String, description: String)
}

/// select all segments from a demand
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

  "-- select all segments from a demand
SELECT
    s.id,
    s.name,
    s.description
FROM
    segment AS s
    INNER JOIN demand_segment AS ds ON ds.segment_id = s.id
WHERE
    ds.demand_id = $1::uuid
ORDER BY
    s.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_services` query
/// defined in `./src/server/company/demand/sql/get_services.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetServicesRow {
  GetServicesRow(id: Uuid, name: String, description: String)
}

/// select all services from a demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_services(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetServicesRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(GetServicesRow(id:, name:, description:))
  }

  "-- select all services from a demand
SELECT
    s.id,
    s.name,
    s.description
FROM
    service AS s
    INNER JOIN demand_service AS ds ON ds.service_id = s.id
WHERE
    ds.demand_id = $1::uuid
ORDER BY
    s.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `get_technologies` query
/// defined in `./src/server/company/demand/sql/get_technologies.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type GetTechnologiesRow {
  GetTechnologiesRow(id: Uuid, name: String, description: String)
}

/// get all technologies that a given demand is assigned to
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn get_technologies(
  db: pog.Connection,
  arg_1: Uuid,
) -> Result(pog.Returned(GetTechnologiesRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(GetTechnologiesRow(id:, name:, description:))
  }

  "-- get all technologies that a given demand is assigned to
SELECT
    t.id,
    t.name,
    t.description
FROM
    public.technology AS t
    INNER JOIN public.demand_technology AS dt ON dt.technology_id = t.id
WHERE
    dt.demand_id = $1::uuid
ORDER BY
    t.id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `register` query
/// defined in `./src/server/company/demand/sql/register.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type RegisterRow {
  RegisterRow(
    id: Uuid,
    company_id: Uuid,
    title: String,
    description: String,
    demand_status: DemandStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// register a new demand on the database
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn register(
  db: pog.Connection,
  arg_1: Uuid,
  arg_2: String,
  arg_3: String,
  arg_4: DemandStatus,
) -> Result(pog.Returned(RegisterRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use company_id <- decode.field(1, uuid_decoder())
    use title <- decode.field(2, decode.string)
    use description <- decode.field(3, decode.string)
    use demand_status <- decode.field(4, demand_status_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(RegisterRow(
      id:,
      company_id:,
      title:,
      description:,
      demand_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- register a new demand on the database
INSERT INTO
    public.demand (
        company_id,
        title,
        description,
        demand_status
    )
VALUES
    (
        $1::uuid,
        $2::text,
        $3::text,
        $4::demand_status
    )
RETURNING
    id,
    company_id,
    title,
    description,
    demand_status,
    created_at,
    updated_at;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(arg_1)))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.parameter(demand_status_encoder(arg_4))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `unassign_expertise` query
/// defined in `./src/server/company/demand/sql/unassign_expertise.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UnassignExpertiseRow {
  UnassignExpertiseRow(id: Uuid, name: String, description: String)
}

/// unassign an expertise from a demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn unassign_expertise(
  db: pog.Connection,
  assigned_demand_id: Uuid,
  assigned_expertise_id: Uuid,
) -> Result(pog.Returned(UnassignExpertiseRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(UnassignExpertiseRow(id:, name:, description:))
  }

  "-- unassign an expertise from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_expertise AS assigned
    WHERE
        assigned.demand_id = $1
        AND assigned.expertise_id = $2
    RETURNING
        assigned.expertise_id
)
SELECT
    expertise.id,
    expertise.name,
    expertise.description
FROM
    deleted
    JOIN expertise ON expertise.id = deleted.expertise_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(assigned_demand_id)))
  |> pog.parameter(pog.text(uuid.to_string(assigned_expertise_id)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `unassign_segment` query
/// defined in `./src/server/company/demand/sql/unassign_segment.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UnassignSegmentRow {
  UnassignSegmentRow(id: Uuid, name: String, description: String)
}

/// unassign a segment from a demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn unassign_segment(
  db: pog.Connection,
  assigned_demand_id: Uuid,
  assigned_segment_id: Uuid,
) -> Result(pog.Returned(UnassignSegmentRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(UnassignSegmentRow(id:, name:, description:))
  }

  "-- unassign a segment from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_segment AS assigned
    WHERE
        assigned.demand_id = $1
        AND assigned.segment_id = $2
    RETURNING
        assigned.segment_id
)
SELECT
    segment.id,
    segment.name,
    segment.description
FROM
    deleted
    JOIN segment ON segment.id = deleted.segment_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(assigned_demand_id)))
  |> pog.parameter(pog.text(uuid.to_string(assigned_segment_id)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `unassign_service` query
/// defined in `./src/server/company/demand/sql/unassign_service.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UnassignServiceRow {
  UnassignServiceRow(id: Uuid, name: String, description: String)
}

/// unassign a service from a demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn unassign_service(
  db: pog.Connection,
  assigned_demand_id: Uuid,
  assigned_service_id: Uuid,
) -> Result(pog.Returned(UnassignServiceRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(UnassignServiceRow(id:, name:, description:))
  }

  "-- unassign a service from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_service AS assigned
    WHERE
        assigned.demand_id = $1
        AND assigned.service_id = $2
    RETURNING
        assigned.service_id
)
SELECT
    service.id,
    service.name,
    service.description
FROM
    deleted
    JOIN service ON service.id = deleted.service_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(assigned_demand_id)))
  |> pog.parameter(pog.text(uuid.to_string(assigned_service_id)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `unassign_technology` query
/// defined in `./src/server/company/demand/sql/unassign_technology.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UnassignTechnologyRow {
  UnassignTechnologyRow(id: Uuid, name: String, description: String)
}

/// unassign a technology from a demand
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn unassign_technology(
  db: pog.Connection,
  assigned_demand_id: Uuid,
  assigned_technology_id: Uuid,
) -> Result(pog.Returned(UnassignTechnologyRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use name <- decode.field(1, decode.string)
    use description <- decode.field(2, decode.string)
    decode.success(UnassignTechnologyRow(id:, name:, description:))
  }

  "-- unassign a technology from a demand
WITH deleted AS (
    DELETE FROM
        public.demand_technology AS assigned
    WHERE
        assigned.demand_id = $1
        AND assigned.technology_id = $2
    RETURNING
        assigned.technology_id
)
SELECT
    technology.id,
    technology.name,
    technology.description
FROM
    deleted
    JOIN technology ON technology.id = deleted.technology_id;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(assigned_demand_id)))
  |> pog.parameter(pog.text(uuid.to_string(assigned_technology_id)))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update` query
/// defined in `./src/server/company/demand/sql/update.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateRow {
  UpdateRow(
    id: Uuid,
    company_id: Uuid,
    title: String,
    description: String,
    demand_status: DemandStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// updates a demand's information
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update(
  db: pog.Connection,
  demand_id: Uuid,
  arg_2: String,
  arg_3: String,
) -> Result(pog.Returned(UpdateRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use company_id <- decode.field(1, uuid_decoder())
    use title <- decode.field(2, decode.string)
    use description <- decode.field(3, decode.string)
    use demand_status <- decode.field(4, demand_status_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(UpdateRow(
      id:,
      company_id:,
      title:,
      description:,
      demand_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- updates a demand's information
UPDATE
    public.demand
SET
    title = coalesce(nullif($2::text, ''), title),
    description = coalesce(nullif($3::text, ''), description),
    updated_at = CURRENT_TIMESTAMP
WHERE
    demand.id = $1
RETURNING
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(demand_id)))
  |> pog.parameter(pog.text(arg_2))
  |> pog.parameter(pog.text(arg_3))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

/// A row you get from running the `update_status` query
/// defined in `./src/server/company/demand/sql/update_status.sql`.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type UpdateStatusRow {
  UpdateStatusRow(
    id: Uuid,
    company_id: Uuid,
    title: String,
    description: String,
    demand_status: DemandStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  )
}

/// update a demand status
///
/// > 🐿️ This function was generated automatically using v4.7.0 of
/// > the [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub fn update_status(
  db: pog.Connection,
  demand_id: Uuid,
  arg_2: DemandStatus,
) -> Result(pog.Returned(UpdateStatusRow), pog.QueryError) {
  let decoder = {
    use id <- decode.field(0, uuid_decoder())
    use company_id <- decode.field(1, uuid_decoder())
    use title <- decode.field(2, decode.string)
    use description <- decode.field(3, decode.string)
    use demand_status <- decode.field(4, demand_status_decoder())
    use created_at <- decode.field(5, pog.timestamp_decoder())
    use updated_at <- decode.field(6, pog.timestamp_decoder())
    decode.success(UpdateStatusRow(
      id:,
      company_id:,
      title:,
      description:,
      demand_status:,
      created_at:,
      updated_at:,
    ))
  }

  "-- update a demand status
UPDATE
    public.demand
SET
    demand_status = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE
    demand.id = $1
RETURNING
    demand.id,
    demand.company_id,
    demand.title,
    demand.description,
    demand.demand_status,
    demand.created_at,
    demand.updated_at;
"
  |> pog.query
  |> pog.parameter(pog.text(uuid.to_string(demand_id)))
  |> pog.parameter(demand_status_encoder(arg_2))
  |> pog.returning(decoder)
  |> pog.execute(db)
}

// --- Enums -------------------------------------------------------------------

/// Corresponds to the Postgres `demand_status` enum.
///
/// > 🐿️ This type definition was generated automatically using v4.7.0 of the
/// > [squirrel package](https://github.com/giacomocavalieri/squirrel).
///
pub type DemandStatus {
  Canceled
  Closed
  Open
}

fn demand_status_decoder() -> decode.Decoder(DemandStatus) {
  use demand_status <- decode.then(decode.string)
  case demand_status {
    "canceled" -> decode.success(Canceled)
    "closed" -> decode.success(Closed)
    "open" -> decode.success(Open)
    _ -> decode.failure(Canceled, "DemandStatus")
  }
}

fn demand_status_encoder(demand_status) -> pog.Value {
  case demand_status {
    Canceled -> "canceled"
    Closed -> "closed"
    Open -> "open"
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

//// Companies look for technological solutions from the
//// [Startups](startup.html#Startup) of Porto Digital.

import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import gleam/uri
import pog
import server/cnpj
import server/company/sql
import server/email
import server/expertise
import server/internal
import server/lgpd
import server/segment
import server/service
import server/technology
import youid/uuid

pub type CompanyError {
  /// Failed to connect to the Database
  DatabaseError(error: pog.QueryError)
  /// Company was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Failed to hash the Company password
  HashError(error: argus.HashError)

  /// Email not found in the Database
  EmailNotFound(email: email.Email)
  /// Company email has invalid format
  InvalidEmail(value: String)
  /// Company's CNPJ has invalid format
  InvalidCnpj(value: String)
  /// Company's website has invalid format
  InvalidWebsite(value: String)

  /// Company provided an incorrect password when during login
  WrongPassword
  /// CNPJ is already registered
  CnpjConflict(value: cnpj.Cnpj)
  /// Email already registered
  EmailConflict(value: email.Email)
  /// Failed to register a new Company
  FailedToRegisterCompany
}

/// Represents a Company supporting a [Startup](startup.html).
pub type Company {
  Company(
    /// User ID for the Company.
    id: uuid.Uuid,
    /// The Company's full name.
    name: String,
    /// Their size, based on the amount of workers.
    size: Size,
    /// The Company's email address.
    email: email.Email,
    /// Their CPNJ, it must be exactly 14 digits
    cnpj: cnpj.Cnpj,
    /// The city where it is located
    city: String,
    /// The state of where it is located
    state: String,
    /// Timestamp of when the Company was registred.
    created_at: timestamp.Timestamp,
    /// Whether the Company is active.
    is_active: Bool,
    /// Company's website
    website: uri.Uri,
  )
}

/// A Company's size is based on the amount of workers.
pub type Size {
  /// Up to 9 workers
  Micro
  /// 10 to 49 workers
  Small
  /// 50 to 249 workers
  Medium
  /// More than 250 workers
  Big
}

@internal
pub fn size_to_string(size: Size) -> String {
  case size {
    Micro -> "micro"
    Small -> "small"
    Medium -> "medium"
    Big -> "big"
  }
}

@internal
pub fn size_to_json(size: Size) -> json.Json {
  size_to_string(size)
  |> json.string
}

@internal
pub fn size_decoder() -> decode.Decoder(Size) {
  use variant <- decode.then(decode.string)
  case variant {
    "micro" -> decode.success(Micro)
    "small" -> decode.success(Small)
    "medium" -> decode.success(Medium)
    "big" -> decode.success(Big)

    _ -> decode.failure(Micro, "Size")
  }
}

/// A decoder that decodes `Company` values.
pub fn decoder() -> decode.Decoder(Company) {
  use id <- decode.field("id", internal.uuid_decoder())
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", email.decoder())
  use size <- decode.field("size", size_decoder())
  use cnpj <- decode.field("cnpj", cnpj.decoder())
  use city <- decode.field("city", decode.string)
  use state <- decode.field("state", decode.string)
  use created_at <- decode.field("created_at", internal.timestamp_decoder())
  use is_active <- decode.field("is_active", decode.bool)
  use website <- decode.field("website", internal.uri_decoder())

  Company(
    id:,
    name:,
    email:,
    created_at:,
    is_active:,
    size:,
    cnpj:,
    city:,
    state:,
    website:,
  )
  |> decode.success
}

/// Encode an `Company` into a JSON
pub fn to_json(company: Company) -> json.Json {
  let Company(
    id:,
    name:,
    email:,
    size:,
    cnpj:,
    city:,
    state:,
    created_at:,
    is_active:,
    website:,
  ) = company

  json.object([
    #("id", internal.uuid_to_json(id)),
    #("name", json.string(name)),
    #("email", json.string(email.to_string(email))),
    #("size", size_to_json(size)),
    #("cnpj", json.string(cnpj.to_string(cnpj))),
    #("city", json.string(city)),
    #("state", json.string(state)),
    #("created_at", internal.timestamp_to_json(created_at)),
    #("is_active", json.bool(is_active)),
    #("website", internal.uri_to_json(website)),
  ])
}

/// Register a Company on the Database
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(website) = uri.parse("wibble.com")
///
/// let result = company.register(
///   context.database,
///   name: "Porto Digital",
///   email: email,
///   password: "wibble",
///   size: company.Big,
///   cnpj: cnpj,
///   description: "Polo de tecnologia do Recife",
///   city: "Recife",
///   state: "Pernambuco",
///   website: website,
/// )
///
/// case result {
///   Error(company.CnpjConflict(..))
///   | Error(company.EmailConflict(..)) -> wisp.response(409)
///
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  name name: String,
  size size: Size,
  email email: email.Email,
  cnpj cnpj: cnpj.Cnpj,
  password password: String,
  city city: String,
  state state: String,
  website website: uri.Uri,
) -> Result(Company, CompanyError) {
  let size = size_to_enum(size)

  use hash <- result.try(
    argus.hasher()
    |> argus.hash(password)
    |> result.map_error(HashError)
    |> result.map(fn(output) { output.encoded_hash }),
  )

  let register_result =
    sql.register(
      database,
      name,
      size,
      email.to_string(email),
      cnpj.to_string(cnpj),
      hash,
      city,
      state,
      uri.to_string(website),
    )

  use returned <- result.try(case register_result {
    // Every Startup CNPJ needs to be unique.
    Error(pog.ConstraintViolated(constraint: "company_cnpj_key", ..)) ->
      Error(CnpjConflict(value: cnpj))

    // A CNPJ needs to have exactly 14 digits.
    Error(pog.ConstraintViolated(constraint: "company_cnpj_check", ..)) ->
      Error(InvalidCnpj(value: cnpj.to_string(cnpj)))

    // Every company Email needs to be unique.
    Error(pog.ConstraintViolated(constraint: "company_email_key", ..)) ->
      Error(EmailConflict(value: email))

    Ok(data) -> Ok(data)
    Error(error) -> Error(DatabaseError(error))
  })

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterCompany),
  )

  use cnpj <- result.try(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(value: row.cnpj)),
  )

  use email <- result.try(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(value: row.email)),
  )

  use website <- result.map(
    uri.parse(row.website)
    |> result.replace_error(InvalidWebsite(value: row.website)),
  )

  Company(
    id: row.id,
    name: row.name,
    email:,
    size: size_from_enum(row.size),
    cnpj:,
    city: row.city,
    state: row.state,
    created_at: row.created_at,
    is_active: row.is_active,
    website: website,
  )
}

/// Verifies the provided `email` and `password`, checking if they matches the
/// ones stored in our Database. Returning Company information if correct.
///
/// ## Examples
///
/// ```gleam
/// let result = company.verify(
///   context.database,
///   email: "my@email.com",
///   password: "password",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(company.NotFound(_)) -> wisp.not_found()
///   Error(company.WrongPassword) -> wisp.response(401)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn verify(
  database: pog.Connection,
  email email: email.Email,
  password password: String,
) -> Result(Company, CompanyError) {
  use returned <- result.try(
    sql.get_credentials(database, email.to_string(email))
    |> result.map_error(DatabaseError),
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(EmailNotFound(email:)),
  )

  // Comparing the given password with the value stored in our Database
  case argus.verify(row.password_hash, password) {
    // Correct password, we can query the user information
    // and send it to the client.
    Ok(True) -> get(database, row.id)

    // Incorrect password
    Ok(False) -> Error(WrongPassword)

    // Something went wrong when hashing the user password
    Error(error) -> Error(HashError(error))
  }
}

/// Search an Company in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = company.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(company.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Company, CompanyError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(NotFound(id:)),
  )

  use cnpj <- result.try(
    cnpj.parse(row.cnpj)
    |> result.replace_error(InvalidCnpj(row.cnpj)),
  )

  use website <- result.try(
    uri.parse(row.website)
    |> result.replace_error(InvalidWebsite(row.website)),
  )

  use email <- result.map(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(row.email)),
  )

  Company(
    id: row.id,
    name: row.name,
    email:,
    created_at: row.created_at,
    is_active: row.is_active,
    size: size_from_enum(row.size),
    cnpj:,
    city: row.city,
    state: row.state,
    website:,
  )
}

fn size_from_enum(enum: sql.CompanySize) -> Size {
  case enum {
    sql.Micro -> Micro
    sql.Small -> Small
    sql.Medium -> Medium
    sql.Big -> Big
  }
}

fn size_to_enum(size: Size) -> sql.CompanySize {
  case size {
    Micro -> sql.Micro
    Small -> sql.Small
    Medium -> sql.Medium
    Big -> sql.Big
  }
}

/// Get all consent records assigned to a given Company
///
/// ## Examples
///
/// ```gleam
/// let result = company.get_lgpd_consent(context.database, id)
///
/// case returned {
///   Ok(data) -> todo as "send response"
///   Error(company.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get_lgpd_consent(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(List(lgpd.Consent), CompanyError) {
  use returned <- result.try(
    sql.get_lgpd_consent(database, id)
    |> result.map_error(DatabaseError),
  )

  use rows <- result.map(case returned.rows {
    [] -> Error(NotFound(id:))
    rows -> Ok(rows)
  })

  list.map(rows, fn(row) {
    case row.consent {
      sql.Granted ->
        lgpd.Granted(
          lgpd.Startup(id:),
          updated_at: row.updated_at,
          version: row.policy_version,
        )

      sql.Revoked ->
        lgpd.Revoked(
          lgpd.Startup(id:),
          updated_at: row.updated_at,
          version: row.policy_version,
        )
    }
  })
}

/// The lifecycle state of a Company's [Demand](#Demand).
pub type DemandStatus {
  /// The Company is accepting matches or proposals for this demand.
  Open
  /// The Company has finished the demand, either because it was fulfilled
  /// or because it is no longer accepting proposals.
  Closed
  /// The Company withdrew the demand before it was fulfilled.
  Canceled
}

/// A technological solution requested by a [Company](#Company).
///
/// A demand describes what the Company is looking for.
pub type Demand {
  Demand(
    /// Unique identifier for the demand.
    id: uuid.Uuid,
    /// The Company that created the demand.
    company: Company,
    /// A short summary of what the Company needs.
    title: String,
    /// A detailed description of the problem, context, and requirements.
    description: String,
    /// Current lifecycle state of the demand.
    status: DemandStatus,
    /// Timestamp of when the demand was created.
    created_at: timestamp.Timestamp,
    /// Timestamp of when the demand was last updated.
    updated_at: timestamp.Timestamp,
    /// Segments required by the Demand
    segments: List(segment.Segment),
    /// Expertises required by the Demand
    expertises: List(expertise.Expertise),
    /// Technologies required by the Demand
    technologies: List(technology.Technology),
    /// Services required by the Demand
    services: List(service.Service),
  )
}

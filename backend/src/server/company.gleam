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
import server/internal
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
}

/// Represents a Company supporting a [Startup](startup.html).
pub type Company {
  Company(
    /// User ID for the Company.
    id: uuid.Uuid,
    /// The Company's full name.
    name: String,
    /// The Company's email address.
    email: email.Email,
    /// Their size, based on the amount of workers.
    size: Size,
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

fn size_to_json(size: Size) -> json.Json {
  case size {
    Micro -> json.string("micro")
    Small -> json.string("small")
    Medium -> json.string("medium")
    Big -> json.string("big")
  }
}

fn size_decoder() -> decode.Decoder(Size) {
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

  decode.success(Company(
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
  ))
}

/// Encode an `Company` into a json string.
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
///   Error(company.NotFound) -> wisp.not_found()
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

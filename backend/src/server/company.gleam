import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/company/sql
import server/email
import server/internal
import youid/uuid

pub type CompanyError {
  /// Failed to connect to the Database
  DatabaseError(pog.QueryError)
  /// Company was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Email not found in the Database
  EmailNotFound(email: email.Email)
  /// Company email has invalid format
  InvalidEmail(value: String)
  /// Company provided an incorrect password when during login
  WrongPassword
  /// Failed to hash the Company password
  HashError(argus.HashError)
}

/// Represents a [Startup](startup.html) Company.
pub type Company {
  Company(
    /// User ID for the Company.
    id: uuid.Uuid,
    /// The Company's full name.
    name: String,
    /// The Company's email address.
    email: email.Email,
    /// Timestamp of when the Company was registred.
    created_at: timestamp.Timestamp,
    /// Whether the Company is active.
    is_active: Bool,
  )
}

pub fn decoder() -> decode.Decoder(Company) {
  use id <- decode.field("id", internal.uuid_decoder())
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", email.decoder())
  use created_at <- decode.field("created_at", internal.timestamp_decoder())
  use is_active <- decode.field("is_active", decode.bool)

  Company(id:, name:, email:, created_at:, is_active:)
  |> decode.success
}

/// Encode an `Company` into a json string.
pub fn to_json(company: Company) -> json.Json {
  let Company(id:, name:, email:, created_at:, is_active:) = company

  json.object([
    #("id", internal.uuid_to_json(id)),
    #("name", json.string(name)),
    #("email", json.string(email.to_string(email))),
    #("created_at", internal.timestamp_to_json(created_at)),
    #("is_active", json.bool(is_active)),
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
  )
}

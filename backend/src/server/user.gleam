//// Types and functions for working with [Users](#User)

import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/calendar
import gleam/time/timestamp
import pog
import server/email
import server/user/sql
import youid/uuid

pub type UserError {
  // General errors -----------------------------------------------------------
  //
  /// Failed to hash the user password
  HashError(argus.HashError)
  /// Failed to connect to the Database
  DatabaseError(error: pog.QueryError)
  /// Failed to register an User
  FailedToRegisterUser
  /// User was not found in the Database
  NotFound(id: uuid.Uuid)
  /// Email doesn't belong to a registered User
  EmailNotFound(email: email.Email)

  // Email related errors -----------------------------------------------------
  //
  /// User emails need to be unique
  EmailConflict(value: email.Email)
  /// User email has invalid format
  InvalidEmail(value: String)

  // Auth related errors -------------------------------------------------------
  //
  /// User provided an incorrect password when during login
  WrongPassword
}

pub type User {
  User(
    /// User ID
    id: uuid.Uuid,
    /// Name of the User
    full_name: String,
    /// Email of the User, needs to be a valid [email.Email](email.html#Email) type
    email: email.Email,
    /// Timestamp of when the user was registred
    created_at: timestamp.Timestamp,
    /// Whether the User's is is still active or not
    is_active: Bool,
  )
}

/// Encode a User into a JSON object.
pub fn to_json(user: User) -> json.Json {
  json.object([
    #("id", uuid_to_json(user.id)),
    #("full_name", json.string(user.full_name)),
    #("email", json.string(email.to_string(user.email))),
    #("created_at", timestamp_to_json(user.created_at)),
    #("is_active", json.bool(user.is_active)),
  ])
}

/// A decoder that decodes `User` values.
pub fn decoder() -> decode.Decoder(User) {
  use id <- decode.field("id", uuid_decoder())
  use full_name <- decode.field("full_name", decode.string)
  use email <- decode.field("email", email.decoder())
  use created_at <- decode.field("created_at", timestamp_decoder())
  use is_active <- decode.field("is_active", decode.bool)

  decode.success(User(id:, full_name:, email:, created_at:, is_active:))
}

fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

fn timestamp_to_json(timestamp: timestamp.Timestamp) -> json.Json {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
  |> json.string()
}

fn timestamp_decoder() -> decode.Decoder(timestamp.Timestamp) {
  use text <- decode.then(decode.string)
  case timestamp.parse_rfc3339(text) {
    Ok(data) -> decode.success(data)
    Error(_) -> decode.failure(timestamp.system_time(), "rfc3339")
  }
}

/// Register a new user in the Database.
///
/// ## Examples
///
/// ```gleam
/// let result = user.register(
///   context.database,
///   full_name: "Vinizin",
///   email: "vinizin@criticlevel.br",
///   password: "password",
/// )
///
/// case result {
///   Ok(_user) -> wisp.response(201)
///   Error(user.EmailConflict) -> wisp.response(409)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  full_name full_name: String,
  email email: email.Email,
  password password: String,
) -> Result(User, UserError) {
  // Postgres doesn't know what a `email.Email` type is, so we need to convert
  // it back to a String before running the query.
  let s_email = email.to_string(email)

  // Here we are hashing the given password using Argon2 so we can store
  // its value in the Database
  use hash <- result.try(
    argus.hasher()
    |> argus.hash(password)
    |> result.map_error(HashError)
    |> result.map(fn(output) { output.encoded_hash }),
  )

  use returned <- result.try(
    case sql.register(database, full_name, s_email, hash) {
      // Every user email needs to be unique, trying to register an User
      // with an email that already exists should result in an Error.
      Error(pog.ConstraintViolated(constraint: "user_account_email_key", ..)) ->
        Error(EmailConflict(value: email))

      // Email has to be a valid format. The value is already parsed before
      // calling this function but it doesn't hurt to check twice.
      Error(pog.ConstraintViolated(constraint: "user_account_email_check", ..)) ->
        Error(InvalidEmail(value: s_email))

      Ok(data) -> Ok(data)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(FailedToRegisterUser),
  )

  use email <- result.map(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(row.email)),
  )

  User(
    id: row.id,
    full_name: row.full_name,
    email: email,
    created_at: row.created_at,
    is_active: row.is_active,
  )
}

/// Search an User in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = user.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(user.NotFound(_)) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(database: pog.Connection, id: uuid.Uuid) -> Result(User, UserError) {
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

  User(
    id: row.id,
    full_name: row.full_name,
    email: email,
    created_at: row.created_at,
    is_active: row.is_active,
  )
}

/// Verifies the provided `email` and `password`, checking if they matche the
/// ones stored in our Database. Returnins User information if correct.
///
/// ## Examples
///
/// ```gleam
/// let result = user.verify(
///   context.database,
///   email: "my@email.com",
///   password: "password",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(user.NotFound) -> wisp.not_found()
///   Error(user.WrongPassword) -> wisp.response(401)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn verify(
  database: pog.Connection,
  email email: email.Email,
  password password: String,
) -> Result(User, UserError) {
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

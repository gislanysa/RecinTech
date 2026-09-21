import argus
import gleam/dynamic/decode
import gleam/json
import gleam/result
import gleam/string
import gleam/time/calendar
import gleam/time/timestamp
import pog
import server/user/sql
import youid/uuid

pub type UserError {
  /// Failed to hash the user password
  HashError(argus.HashError)
  /// Failed to connect to the Database
  DatabaseError(pog.QueryError)
  /// Failed to register an User
  FailedToRegisterUser
  /// User was not found in the Database
  NotFound
  /// User emails need to be unique
  EmailConflict
  /// User email has invalid format
  InvalidEmailFormat
  /// User provided an incorrect password
  WrongPassword
}

/// User's account.
pub type User {
  User(
    /// User ID
    id: uuid.Uuid,
    /// Name of the User
    full_name: String,
    /// Email of the User
    email: String,
    /// Timestamp of when the user was registred.
    created_at: timestamp.Timestamp,
    /// If the User is active or not.
    is_active: Bool,
  )
}

pub fn to_json(user: User) -> json.Json {
  let User(id:, full_name:, email:, created_at:, is_active:) = user
  json.object([
    #("id", uuid_to_json(id)),
    #("full_name", json.string(full_name)),
    #("email", json.string(email)),
    #("created_at", timestamp_to_json(created_at)),
    #("is_active", json.bool(is_active)),
  ])
}

pub fn decoder() -> decode.Decoder(User) {
  use id <- decode.field("id", uuid_decoder())
  use full_name <- decode.field("full_name", decode.string)
  use email <- decode.field("email", decode.string)
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
///   "Vinizin",
///   "vinizin@criticlevel.br",
///   "senha123",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn register(
  database: pog.Connection,
  full_name full_name: String,
  email email: String,
  password password: String,
) -> Result(User, UserError) {
  use email <- result.try(case string.split_once(email, "@") {
    Ok(#("", _)) | Ok(#(_, "")) | Error(_) -> Error(InvalidEmailFormat)
    Ok(_) -> Ok(email)
  })

  use output <- result.try(
    argus.hasher()
    |> argus.hash(password)
    |> result.map_error(HashError),
  )

  use returned <- result.try(
    case sql.register(database, full_name, email, output.encoded_hash) {
      Error(pog.ConstraintViolated(constraint: "user_account_email_key", ..)) ->
        Error(EmailConflict)

      Ok(data) -> Ok(data)
      Error(err) -> Error(DatabaseError(err))
    },
  )

  case returned.rows {
    [] -> Error(FailedToRegisterUser)
    [row, ..] ->
      Ok(User(
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        created_at: row.created_at,
        is_active: row.is_active,
      ))
  }
}

/// Search an user in the Database using their ID.
///
/// ## Examples
///
/// ```gleam
/// let result = user.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(user.NotFound) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(database: pog.Connection, id: uuid.Uuid) -> Result(User, UserError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  case returned.rows {
    [] -> Error(NotFound)
    [row, ..] ->
      Ok(User(
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        created_at: row.created_at,
        is_active: row.is_active,
      ))
  }
}

/// Verifies the provided `email` and `password`, checking if it matches the
/// ones stored in our Database and returning the correct User.
///
/// ## Examples
///
/// ```gleam
/// let result = user.verify(context.database, "my@email.com", "password")
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
  email email: String,
  password password: String,
) -> Result(User, UserError) {
  use returned <- result.try(
    sql.get_credentials(database, email)
    |> result.map_error(DatabaseError),
  )

  use row <- result.try(case returned.rows {
    [] -> Error(NotFound)
    [row, ..] -> Ok(row)
  })

  case argus.verify(row.password_hash, password) {
    // Correct password
    Ok(True) -> get(database, row.id)

    // Incorrect password
    Ok(False) -> Error(WrongPassword)

    // Something went wrong when hashing the user password
    Error(err) -> Error(HashError(err))
  }
}

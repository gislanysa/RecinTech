import argus
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/calendar
import gleam/time/timestamp
import pog
import server/email
import server/investor/sql
import youid/uuid

pub type InvestorError {
  /// Failed to connect to the Database
  DatabaseError(pog.QueryError)
  /// Investor was not found in the Database
  NotFound
  /// Email not found in the Database
  EmailNotFound(email: email.Email)
  /// Investor email has invalid format
  InvalidEmail(value: String)
  /// Investor provided an incorrect password when during login
  WrongPassword
  /// Failed to hash the Investor password
  HashError(argus.HashError)
}

/// The category of Investor backing a Startup.
pub type Kind {
  /// A person investing their own money in early startups.
  Angel
  /// A company investing pooled money in growing startups.
  Venture
  /// A regular person backing startups through crowdfunding.
  Individual
  /// A big organization investing huge amounts in later startups.
  Institutional
}

fn kind_decoder() -> decode.Decoder(Kind) {
  use variant <- decode.then(decode.string)
  case variant {
    "angel" -> decode.success(Angel)
    "venture" -> decode.success(Venture)
    "individual" -> decode.success(Individual)
    "institutional" -> decode.success(Institutional)
    _ -> decode.failure(Angel, "Kind")
  }
}

fn kind_to_json(kind: Kind) -> json.Json {
  case kind {
    Angel -> json.string("angel")
    Venture -> json.string("venture")
    Individual -> json.string("individual")
    Institutional -> json.string("institutional")
  }
}

/// Represents a [Startup](startup.html) Investor.
pub type Investor {
  Investor(
    /// User ID for the Investor.
    id: uuid.Uuid,
    /// The Investor's full name.
    name: String,
    /// The category of the investor.
    kind: Kind,
    /// Whether their profile is public.
    public_profile: Bool,
    /// The Investor's email address.
    email: email.Email,
    /// Timestamp of when the Investor was registred.
    created_at: timestamp.Timestamp,
    /// Whether the Investor is active.
    is_active: Bool,
  )
}

pub fn decoder() -> decode.Decoder(Investor) {
  use id <- decode.field("id", uuid_decoder())
  use kind <- decode.field("kind", kind_decoder())
  use public_profile <- decode.field("public_profile", decode.bool)
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", email.decoder())
  use created_at <- decode.field("created_at", timestamp_decoder())
  use is_active <- decode.field("is_active", decode.bool)

  Investor(id:, kind:, public_profile:, name:, email:, created_at:, is_active:)
  |> decode.success
}

/// Encode an `Investor` into a json string.
pub fn to_json(investor: Investor) -> json.Json {
  let Investor(
    id:,
    kind:,
    public_profile:,
    name:,
    email:,
    created_at:,
    is_active:,
  ) = investor
  json.object([
    #("id", uuid_to_json(id)),
    #("kind", kind_to_json(kind)),
    #("public_profile", json.bool(public_profile)),
    #("name", json.string(name)),
    #("email", json.string(email.to_string(email))),
    #("created_at", timestamp_to_json(created_at)),
    #("is_active", json.bool(is_active)),
  ])
}

/// Encode a `timestamp.Timestamp` into a rfc3339 JSON string.
fn timestamp_to_json(timestamp: timestamp.Timestamp) -> json.Json {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
  |> json.string()
}

/// A decoder that decodes `timestamp.Timestamp` rfc3339 values.
fn timestamp_decoder() -> decode.Decoder(timestamp.Timestamp) {
  use string <- decode.then(decode.string)
  case timestamp.parse_rfc3339(string) {
    Ok(data) -> decode.success(data)
    Error(_) -> decode.failure(timestamp.system_time(), "rfc3339")
  }
}

/// Encode a `uuid.Uuid` into a json string.
fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

/// A decoder that decodes `uuid.Uuid` values.
fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

/// Verifies the provided `email` and `password`, checking if they matches the
/// ones stored in our Database. Returning Investor information if correct.
///
/// ## Examples
///
/// ```gleam
/// let result = investor.verify(
///   context.database,
///   email: "my@email.com",
///   password: "password",
/// )
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(investor.NotFound) -> wisp.not_found()
///   Error(investor.WrongPassword) -> wisp.response(401)
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn verify(
  database: pog.Connection,
  email email: email.Email,
  password password: String,
) -> Result(Investor, InvestorError) {
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

/// Search an Investor in the Database
///
/// ## Examples
///
/// ```gleam
/// let result = investor.get(context.database, id)
///
/// case result {
///   Ok(data) -> todo as "send response"
///   Error(investor.NotFound) -> wisp.not_found()
///   Error(_) -> wisp.internal_server_error()
/// }
/// ```
pub fn get(
  database: pog.Connection,
  id: uuid.Uuid,
) -> Result(Investor, InvestorError) {
  use returned <- result.try(
    sql.get(database, id)
    |> result.map_error(DatabaseError),
  )

  use row <- result.try(
    list.first(returned.rows)
    |> result.replace_error(NotFound),
  )

  use email <- result.map(
    email.parse(row.email)
    |> result.replace_error(InvalidEmail(row.email)),
  )

  let kind = case row.kind {
    sql.Institutional -> Institutional
    sql.Individual -> Individual
    sql.Venture -> Venture
    sql.Angel -> Angel
  }

  Investor(
    id: row.id,
    kind:,
    public_profile: row.public_profile,
    name: row.name,
    email:,
    created_at: row.created_at,
    is_active: row.is_active,
  )
}

/// Convert a [Kind](#Kind) into a lowercase String
///
/// ## Examples
///
/// ```gleam
/// assert investor.kind_to_string(investor.Angel) == "angel"
/// assert investor.kind_to_string(investor.Venture) == "venture"
/// ```
pub fn kind_to_string(kind: Kind) -> String {
  case kind {
    Angel -> "angel"
    Venture -> "venture"
    Individual -> "individual"
    Institutional -> "institutional"
  }
}

/// Convert a String into a [Kind](#Kind)
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(kind) = investor.kind_from_string("angel")
/// assert kind == investor.Angel
/// ```
pub fn kind_from_string(string: String) -> Result(Kind, Nil) {
  case string {
    "angel" -> Ok(Angel)
    "venture" -> Ok(Venture)
    "individual" -> Ok(Individual)
    "institutional" -> Ok(Institutional)

    _ -> Error(Nil)
  }
}

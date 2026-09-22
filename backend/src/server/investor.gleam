import gleam/list
import gleam/result
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
  /// Investor email has invalid format
  InvalidEmail(value: String)
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

/// Represents a [Startup](startup.html) Investor.
pub type Investor {
  Investor(
    /// User ID for the Investor.
    id: uuid.Uuid,
    /// The category of the investor.
    kind: Kind,
    /// Whether their profile is public.
    public_profile: Bool,
    /// The Investor's full name.
    full_name: String,
    /// The Investor's email address.
    email: email.Email,
    /// Timestamp of when the Investor was registred.
    created_at: timestamp.Timestamp,
    /// Whether the Investor is active.
    is_active: Bool,
  )
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
    full_name: row.full_name,
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

import gleam/result
import pog
import server/lgpd/sql
import youid/uuid

pub type LgpdError {
  /// Failed to query the Database
  DatabaseError(error: pog.QueryError)
  /// Startup or Investor was not found in the Database
  SubjectNotFound(id: uuid.Uuid)
  /// Policy version needs to be greater than zero
  InvalidPolicyVersion(version: Int)
}

pub type Subject {
  Startup(id: uuid.Uuid)
  Investor(id: uuid.Uuid)
}

pub fn grant_consent(
  database: pog.Connection,
  to subject: Subject,
  version version: Int,
) -> Result(Nil, LgpdError) {
  use version <- result.try(case version {
    version if version > 0 -> Ok(version)
    version -> Error(InvalidPolicyVersion(version:))
  })

  case subject {
    Startup(id:) ->
      case sql.grant_startup_consent(database, id, version) {
        Error(pog.ConstraintViolated(
          constraint: "startup_lgpd_consent_startup_id_fkey",
          ..,
        )) -> Error(SubjectNotFound(id:))

        Error(pog.ConstraintViolated(
          constraint: "startup_lgpd_consent_policy_version_check",
          ..,
        )) -> Error(InvalidPolicyVersion(version:))

        Ok(_) -> Ok(Nil)
        Error(error) -> Error(DatabaseError(error))
      }

    Investor(id:) ->
      case sql.grant_investor_consent(database, id, version) {
        Error(pog.ConstraintViolated(
          constraint: "investor_lgpd_consent_investor_id_fkey",
          ..,
        )) -> Error(SubjectNotFound(id:))

        Error(pog.ConstraintViolated(
          constraint: "investor_lgpd_consent_policy_version_check",
          ..,
        )) -> Error(InvalidPolicyVersion(version:))

        Ok(_) -> Ok(Nil)
        Error(error) -> Error(DatabaseError(error))
      }
  }
}

//// Manages user consent tracking and policy versioning for compliance with the
//// Brazilian General Data Protection Law (Lei Geral de Proteção de Dados).

import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/lgpd/sql
import youid/uuid

pub type LgpdError {
  /// Failed to query the Database
  DatabaseError(error: pog.QueryError)
  /// Startup or Investor was not found in the Database
  SubjectNotFound(id: uuid.Uuid)
  /// Policy version needs to be an Int greater than zero
  InvalidPolicyVersion(version: Int)
  /// Failed to grant or revoke consent to the LGPD
  FailedToUpdateConsent(subject: Subject)
}

pub type Subject {
  Startup(id: uuid.Uuid)
  Investor(id: uuid.Uuid)
}

/// A Startup / Investor may grant or revoke consent
/// to the General Data Protection Law.
pub type Consent {
  Granted(
    subject: Subject,
    updated_at: timestamp.Timestamp,
    policy_version: Int,
  )
  Revoked(
    subject: Subject,
    updated_at: timestamp.Timestamp,
    policy_version: Int,
  )
}

pub fn grant_consent(
  database: pog.Connection,
  for subject: Subject,
  policy_version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Granted, version)
}

pub fn revoke_consent(
  database: pog.Connection,
  for subject: Subject,
  policy_version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Revoked, version)
}

fn require_valid_policy_version(
  version: Int,
  next: fn(Int) -> Result(a, LgpdError),
) -> Result(a, LgpdError) {
  case version {
    version if version > 0 -> next(version)
    version -> Error(InvalidPolicyVersion(version:))
  }
}

fn do_update_consent(
  database: pog.Connection,
  subject: Subject,
  consent_enum: sql.LgpdConsent,
  version: Int,
) -> Result(Consent, LgpdError) {
  use version <- require_valid_policy_version(version)

  case subject {
    Startup(id:) -> {
      use returned <- result.try(
        case sql.update_startup_consent(database, id, consent_enum, version) {
          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_startup_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_policy_version_check",
            ..,
          )) -> Error(InvalidPolicyVersion(version:))

          Ok(returned) -> Ok(returned)
          Error(error) -> Error(DatabaseError(error))
        },
      )

      use row <- result.map(
        list.first(returned.rows)
        |> result.replace_error(FailedToUpdateConsent(subject:)),
      )

      case row.consent {
        sql.Granted ->
          Granted(
            subject:,
            updated_at: row.updated_at,
            policy_version: row.policy_version,
          )

        sql.Revoked ->
          Revoked(
            subject:,
            updated_at: row.updated_at,
            policy_version: row.policy_version,
          )
      }
    }

    Investor(id:) -> {
      use returned <- result.try(
        case sql.update_investor_consent(database, id, sql.Granted, version) {
          Error(pog.ConstraintViolated(
            constraint: "investor_lgpd_consent_investor_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          Error(pog.ConstraintViolated(
            constraint: "investor_lgpd_consent_policy_version_check",
            ..,
          )) -> Error(InvalidPolicyVersion(version:))

          Ok(returned) -> Ok(returned)
          Error(error) -> Error(DatabaseError(error))
        },
      )

      use row <- result.map(
        list.first(returned.rows)
        |> result.replace_error(FailedToUpdateConsent(subject:)),
      )

      case row.consent {
        sql.Granted ->
          Granted(
            subject:,
            updated_at: row.updated_at,
            policy_version: row.policy_version,
          )

        sql.Revoked ->
          Revoked(
            subject:,
            updated_at: row.updated_at,
            policy_version: row.policy_version,
          )
      }
    }
  }
}

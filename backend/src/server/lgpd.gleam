//// Manages user consent tracking and policy versioning for compliance with the
//// Brazilian General Data Protection Law (Lei Geral de Proteção de Dados).

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/time/timestamp
import pog
import server/internal
import server/lgpd/sql
import youid/uuid

pub type LgpdError {
  /// Failed to query the Database
  DatabaseError(error: pog.QueryError)
  /// Subject was not found in the Database
  SubjectNotFound(id: uuid.Uuid)
  /// Policy version needs to be an `Int` greater than zero
  InvalidPolicyVersion(version: Int)
  /// Failed to grant or revoke consent
  FailedToUpdateConsent(subject: Subject)
}

/// Entity (Startup or Investor) granting or revoking consent to their data.
pub type Subject {
  /// A startup entity
  Startup(id: uuid.Uuid)
  /// An Investor entity
  Investor(id: uuid.Uuid)
}

@internal
pub fn subject_decoder() -> decode.Decoder(Subject) {
  use variant <- decode.field("type", decode.string)

  case variant {
    "startup" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Startup(id:))
    }

    "investor" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Investor(id:))
    }

    _ -> decode.failure(Startup(id: uuid.v7()), "Subject")
  }
}

@internal
pub fn subject_to_json(subject: Subject) -> json.Json {
  case subject {
    Startup(id:) ->
      json.object([
        #("type", json.string("startup")),
        #("id", internal.uuid_to_json(id)),
      ])

    Investor(id:) ->
      json.object([
        #("type", json.string("investor")),
        #("id", internal.uuid_to_json(id)),
      ])
  }
}

/// A Startup / Investor may grant or revoke consent
/// to the General Data Protection Law.
pub type Consent {
  /// A Subject granted access to their data.
  Granted(subject: Subject, updated_at: timestamp.Timestamp, version: Int)
  /// A Subject revoked access to their data and we are not allowed to use it.
  Revoked(subject: Subject, updated_at: timestamp.Timestamp, version: Int)
}

@internal
pub fn consent_to_json(consent: Consent) -> json.Json {
  case consent {
    Granted(subject:, updated_at:, version:) ->
      json.object([
        #("type", json.string("granted")),
        #("subject", subject_to_json(subject)),
        #("updated_at", internal.timestamp_to_json(updated_at)),
        #("version", json.int(version)),
      ])

    Revoked(subject:, updated_at:, version:) ->
      json.object([
        #("type", json.string("revoked")),
        #("subject", subject_to_json(subject)),
        #("updated_at", internal.timestamp_to_json(updated_at)),
        #("version", json.int(version)),
      ])
  }
}

@internal
pub fn consent_decoder() -> decode.Decoder(Consent) {
  use variant <- decode.field("type", decode.string)

  case variant {
    "granted" -> {
      use subject <- decode.field("subject", subject_decoder())
      use updated_at <- decode.field("updated_at", internal.timestamp_decoder())
      use version <- decode.field("version", decode.int)
      decode.success(Granted(subject:, updated_at:, version:))
    }

    "revoked" -> {
      use subject <- decode.field("subject", subject_decoder())
      use updated_at <- decode.field("updated_at", internal.timestamp_decoder())
      use version <- decode.field("version", decode.int)
      decode.success(Revoked(subject:, updated_at:, version:))
    }

    _ ->
      decode.failure(
        Revoked(
          subject: Startup(uuid.v7()),
          updated_at: timestamp.system_time(),
          version: 1,
        ),
        "Consent",
      )
  }
}

/// Grants LGPD consent for a given entity and policy version.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   lgpd.grant_consent(context.database, for: lgpd.Startup(id), version: 1)
///
/// case result {
///   Ok(lgpd.Granted(..)) -> todo as "send response"
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn grant_consent(
  database: pog.Connection,
  for subject: Subject,
  version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Granted, version)
}

/// Revokes LGPD consent for a given entity and policy version.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   lgpd.revoke_consent(context.database, for: lgpd.Startup(id), version: 1)
///
/// case result {
///   Ok(lgpd.Revoked(..)) -> todo as "send response"
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn revoke_consent(
  database: pog.Connection,
  from subject: Subject,
  version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Revoked, version)
}

/// Returns `Error(InvalidPolicyVersion)` if the policy version
/// is equals or less than zero.
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
  target_consent: sql.LgpdConsent,
  version: Int,
) -> Result(Consent, LgpdError) {
  use version <- require_valid_policy_version(version)

  case subject {
    Startup(id:) -> {
      use returned <- result.try(
        case sql.update_startup_consent(database, id, target_consent, version) {
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

      // This ensures that the record was properly updated to the
      // target value.
      use row <- result.map(case list.first(returned.rows) {
        Ok(found) if found.consent == target_consent -> Ok(found)

        // If the returned value was different from the expected, then we
        // failed to update the record.
        Ok(_) | Error(_) -> Error(FailedToUpdateConsent(subject:))
      })

      case row.consent {
        sql.Granted ->
          Granted(
            subject:,
            updated_at: row.updated_at,
            version: row.policy_version,
          )

        sql.Revoked ->
          Revoked(
            subject:,
            updated_at: row.updated_at,
            version: row.policy_version,
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

      // This ensures that the record was properly updated to the
      // target value.
      use row <- result.map(case list.first(returned.rows) {
        Ok(found) if found.consent == target_consent -> Ok(found)

        // If the returned value was different from the expected, then we
        // failed to update the record.
        Ok(_) | Error(_) -> Error(FailedToUpdateConsent(subject:))
      })

      case row.consent {
        sql.Granted ->
          Granted(
            subject:,
            updated_at: row.updated_at,
            version: row.policy_version,
          )

        sql.Revoked ->
          Revoked(
            subject:,
            updated_at: row.updated_at,
            version: row.policy_version,
          )
      }
    }
  }
}

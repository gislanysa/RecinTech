//// Manages consent tracking and privacy-policy versioning for compliance with
//// the Brazilian General Data Protection Law (Lei Geral de Proteção de Dados).
////
//// Every consent change is recorded for a [Subject](#Subject), which can be a
//// Startup or a Company, and references a [Policy](#Policy) version. Policies
//// are immutable documents: registering a new policy version marks the previous
//// one as inactive and makes the new one current. The current version is the one
//// the API requires when a subject grants or revokes consent.

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

  /// LGPD policy not found with the given version
  PolicyNotFound(version: Int)
  /// Tried to register a policy version that already exists
  PolicyVersionConflict(Int)
  /// There isn't a current policy
  CurrentPolicyNotFound
  /// Failed to update a policy
  FailedToUpdatePolicy(version: Int)
}

/// Entity (Startup or Company) granting or revoking consent to their data.
pub type Subject {
  /// A Startup entity.
  Startup(id: uuid.Uuid)
  /// A Company entity.
  Company(id: uuid.Uuid)
}

/// A published version of the privacy policy.
///
/// Only one policy can be current at a time. When a new policy is registered,
/// the previous current policy is marked as inactive.
pub type Policy {
  Policy(
    /// The policy version number.
    version: Int,
    /// URL of the policy document.
    document_url: String,
    /// Hash used to verify the integrity of the policy document.
    document_hash: String,
    /// Timestamp of when the policy was published.
    published_at: timestamp.Timestamp,
    /// Whether this is the currently active policy.
    is_current: Bool,
  )
}

/// Fetch a policy by version.
///
/// Returns `PolicyNotFound` if the version does not exist, and
/// `InvalidPolicyVersion` if the version is not greater than zero.
///
/// ## Examples
///
/// ```gleam
/// case lgpd.get_policy(context.database, version: 1) {
///   Ok(lgpd.Policy(..)) -> wisp.ok()
///   Error(lgpd.PolicyNotFound(_)) -> wisp.not_found()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn get_policy(
  database: pog.Connection,
  version version: Int,
) -> Result(Policy, LgpdError) {
  use version <- require_valid_policy_version(version)

  use returned <- result.try(
    sql.get_policy(database, version)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(PolicyNotFound(version)),
  )

  Policy(
    version: row.version,
    document_url: row.document_url,
    document_hash: row.document_hash,
    published_at: row.published_at,
    is_current: row.is_current,
  )
}

/// Fetch the currently active policy.
///
/// Returns `CurrentPolicyNotFound` if no policy is marked as current.
///
/// ## Examples
///
/// ```gleam
/// case lgpd.get_current_policy(context.database) {
///   Ok(lgpd.Policy(is_current: True, ..)) -> wisp.ok()
///   Error(lgpd.CurrentPolicyNotFound) -> wisp.not_found()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn get_current_policy(
  database: pog.Connection,
) -> Result(Policy, LgpdError) {
  use returned <- result.try(
    sql.get_current_policy(database)
    |> result.map_error(DatabaseError),
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(CurrentPolicyNotFound),
  )

  Policy(
    version: row.version,
    document_url: row.document_url,
    document_hash: row.document_hash,
    published_at: row.published_at,
    is_current: row.is_current,
  )
}

/// Register a new active policy document. The previous policy is marked as
/// inactive and the new one is set as current.
///
/// The version must be greater than zero and must not already exist.
///
/// ## Examples
///
/// ```gleam
/// let result = lgpd.register_new_policy(
///   context.database,
///   version: 2,
///   document_url: "https://example.com/privacy/v2",
///   document_hash: "abc123",
/// )
///
/// case result {
///   Ok(lgpd.Policy(is_current: True, ..)) -> wisp.response(201)
///   Error(lgpd.PolicyVersionConflict(_)) -> wisp.response(409)
///   Error(lgpd.InvalidPolicyVersion(_)) -> wisp.bad_request()
///   Error(error) -> handle_error(error)
/// }
/// ```
pub fn register_new_policy(
  database: pog.Connection,
  version version: Int,
  document_url document_url: String,
  document_hash document_hash: String,
) -> Result(Policy, LgpdError) {
  use version <- require_valid_policy_version(version)

  use returned <- result.try(
    case sql.register_policy(database, version, document_url, document_hash) {
      Error(pog.ConstraintViolated(constraint: "lgpd_policy_pkey", ..)) ->
        Error(PolicyVersionConflict(version))

      Error(pog.ConstraintViolated(constraint: "lgpd_policy_version_check", ..)) ->
        Error(InvalidPolicyVersion(version))

      Ok(data) -> Ok(data)
      Error(error) -> Error(DatabaseError(error))
    },
  )

  use row <- result.map(
    list.first(returned.rows)
    |> result.replace_error(FailedToUpdatePolicy(version)),
  )

  Policy(
    version: row.version,
    document_url: row.document_url,
    document_hash: row.document_hash,
    published_at: row.published_at,
    is_current: row.is_current,
  )
}

/// A decoder that decodes [Subject](#Subject) values.
@internal
pub fn subject_decoder() -> decode.Decoder(Subject) {
  use variant <- decode.field("type", decode.string)

  case variant {
    "startup" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Startup(id:))
    }

    "company" -> {
      use id <- decode.field("id", internal.uuid_decoder())
      decode.success(Company(id:))
    }

    _ -> decode.failure(Startup(id: uuid.v7()), "Subject")
  }
}

/// Encode a [Subject](#Subject) into JSON.
@internal
pub fn subject_to_json(subject: Subject) -> json.Json {
  case subject {
    Startup(id:) ->
      json.object([
        #("type", json.string("startup")),
        #("id", internal.uuid_to_json(id)),
      ])

    Company(id:) ->
      json.object([
        #("type", json.string("company")),
        #("id", internal.uuid_to_json(id)),
      ])
  }
}

/// A [Subject](#Subject)'s consent state regarding a [Policy](#Policy) version.
///
/// The most recent consent for a subject is the one that should be considered.
pub type Consent {
  /// The Subject allowed its data to be used as described by the policy version.
  Granted(
    /// The Startup or Company the consent belongs to.
    subject: Subject,
    /// When the consent was last changed.
    updated_at: timestamp.Timestamp,
    /// The policy version the consent refers to.
    version: Int,
  )

  /// The Subject revoked access to its data, so it must not be used.
  Revoked(
    /// The Startup or Company the consent belongs to.
    subject: Subject,
    /// When the consent was last changed.
    updated_at: timestamp.Timestamp,
    /// The policy version the consent refers to.
    version: Int,
  )
}

/// Encode a [Consent](#Consent) into JSON.
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

/// A decoder that decodes [Consent](#Consent) values.
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

/// Grant LGPD (Lei Geral de Proteção de Dados) consent for a Subject at a
/// given policy version. Once granted, the Subject allows its data to be used
/// as described by that version of the privacy policy.
///
/// The HTTP layer only accepts the [current policy](#get_current_policy)
/// version, but this function accepts any existing version.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   lgpd.grant_consent(context.database, for: lgpd.Startup(id), version: 1)
///
/// case result {
///   Ok(lgpd.Granted(..)) -> wisp.ok()
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
@internal
pub fn grant_consent(
  database: pog.Connection,
  for subject: Subject,
  version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Granted, version)
}

/// Revoke LGPD (Lei Geral de Proteção de Dados) consent for a Subject at a
/// given policy version. Once revoked, the Subject no longer allows its data
/// to be used as described by that version of the privacy policy.
///
/// The HTTP layer only accepts the [current policy](#get_current_policy)
/// version, but this function accepts any existing version.
///
/// ## Examples
///
/// ```gleam
/// let result =
///   lgpd.revoke_consent(context.database, for: lgpd.Startup(id), version: 1)
///
/// case result {
///   Ok(lgpd.Revoked(..)) -> wisp.ok()
///   Ok(_) -> wisp.internal_server_error()
///   Error(error) -> handle_error(error)
/// }
/// ```
@internal
pub fn revoke_consent(
  database: pog.Connection,
  from subject: Subject,
  version version: Int,
) -> Result(Consent, LgpdError) {
  do_update_consent(database, subject, sql.Revoked, version)
}

/// Returns `Error(InvalidPolicyVersion)` if the policy version is less than or
/// equal to zero; otherwise calls `next` with the version.
fn require_valid_policy_version(
  version: Int,
  next: fn(Int) -> Result(a, LgpdError),
) -> Result(a, LgpdError) {
  case version {
    version if version > 0 -> next(version)
    version -> Error(InvalidPolicyVersion(version:))
  }
}

/// Update the consent state of a Subject and verify that the stored value
/// matches the requested one.
///
/// Used by [grant_consent](#grant_consent) and [revoke_consent](#revoke_consent).
fn do_update_consent(
  database: pog.Connection,
  subject: Subject,
  consent: sql.LgpdConsent,
  version: Int,
) -> Result(Consent, LgpdError) {
  use version <- require_valid_policy_version(version)

  case subject {
    Startup(id:) -> {
      use returned <- result.try(
        case sql.update_startup_consent(database, id, consent, version) {
          // startup not found
          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_startup_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          // policy not found
          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_policy_version_fkey",
            ..,
          )) -> Error(PolicyNotFound(version:))

          // needed once consent events are inserted by the same statement
          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_event_startup_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          Error(pog.ConstraintViolated(
            constraint: "startup_lgpd_consent_event_policy_version_fkey",
            ..,
          )) -> Error(PolicyNotFound(version:))

          Ok(returned) -> Ok(returned)
          Error(error) -> Error(DatabaseError(error))
        },
      )

      // This ensures that the record was properly updated to the target value.
      use row <- result.map(case list.first(returned.rows) {
        Ok(found) if found.consent == consent -> Ok(found)

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

    Company(id:) -> {
      use returned <- result.try(
        case sql.update_company_consent(database, id, consent, version) {
          // company not found
          Error(pog.ConstraintViolated(
            constraint: "company_lgpd_consent_company_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          // policy not found
          Error(pog.ConstraintViolated(
            constraint: "company_lgpd_consent_policy_version_fkey",
            ..,
          )) -> Error(PolicyNotFound(version:))

          // needed once consent events are inserted by the same statement
          Error(pog.ConstraintViolated(
            constraint: "company_lgpd_consent_event_company_id_fkey",
            ..,
          )) -> Error(SubjectNotFound(id:))

          Error(pog.ConstraintViolated(
            constraint: "company_lgpd_consent_event_policy_version_fkey",
            ..,
          )) -> Error(PolicyNotFound(version:))

          Ok(returned) -> Ok(returned)
          Error(error) -> Error(DatabaseError(error))
        },
      )

      // This ensures that the record was properly updated to the target value.
      use row <- result.map(case list.first(returned.rows) {
        Ok(found) if found.consent == consent -> Ok(found)

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

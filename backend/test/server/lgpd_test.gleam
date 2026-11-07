import gleam/string
import pog
import server/dummy
import server/lgpd
import server_test
import youid/uuid

pub fn grant_lgpd_consent_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = 1

  let assert Ok(returned) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(startup.id),
      version: version,
    )

  assert returned
    == lgpd.Granted(
      subject: lgpd.Startup(startup.id),
      updated_at: returned.updated_at,
      version: version,
    )

  Nil
}

pub fn grant_lgpd_consent_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let version = 1

  let assert Ok(returned) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Company(company.id),
      version: version,
    )

  assert returned
    == lgpd.Granted(
      subject: lgpd.Company(company.id),
      updated_at: returned.updated_at,
      version: version,
    )

  Nil
}

pub fn revoke_lgpd_consent_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = 1

  let assert Ok(returned) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Startup(startup.id),
      version: version,
    )

  assert returned
    == lgpd.Revoked(
      subject: lgpd.Startup(startup.id),
      updated_at: returned.updated_at,
      version: version,
    )

  Nil
}

pub fn revoke_lgpd_consent_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let version = 1

  let assert Ok(returned) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Company(company.id),
      version: version,
    )

  assert returned
    == lgpd.Revoked(
      subject: lgpd.Company(company.id),
      updated_at: returned.updated_at,
      version: version,
    )

  Nil
}

pub fn revoke_lgpd_consent_startup_twice_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = 1

  let assert Ok(first) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Startup(startup.id),
      version: version,
    )

  let assert Ok(second) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Startup(startup.id),
      version: version,
    )

  assert first == second

  Nil
}

pub fn grant_lgpd_consent_startup_then_revoke_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = 1

  let assert Ok(granted) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(startup.id),
      version: version,
    )

  let assert Ok(revoked) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Startup(startup.id),
      version: version,
    )

  assert granted
    == lgpd.Granted(
      subject: lgpd.Startup(startup.id),
      updated_at: granted.updated_at,
      version: version,
    )

  assert revoked
    == lgpd.Revoked(
      subject: lgpd.Startup(startup.id),
      updated_at: granted.updated_at,
      version: version,
    )

  Nil
}

pub fn grant_lgpd_consent_startup_twice_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = 1

  let assert Ok(first) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(startup.id),
      version: version,
    )

  let assert Ok(second) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(startup.id),
      version: version,
    )

  assert first == second
}

pub fn grant_lgpd_consent_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let version = 1

  let assert Error(lgpd.SubjectNotFound(returned)) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(id),
      version: version,
    )

  assert returned == id

  Nil
}

pub fn grant_lgpd_consent_invalid_policy_version_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let version = -1

  let assert Error(lgpd.InvalidPolicyVersion(returned)) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(startup.id),
      version: version,
    )

  assert returned == version

  Nil
}

pub fn get_policy_test() -> Nil {
  use context <- server_test.with_context()

  let version = 1
  let assert Ok(returned) = lgpd.get_policy(context.database, version:)

  assert returned
    == lgpd.Policy(
      version:,
      document_url: "http://localhost:3000/privacidade",
      document_hash: string.repeat("0", 64),
      published_at: returned.published_at,
      is_current: True,
    )

  Nil
}

pub fn get_missing_policy_test() -> Nil {
  use context <- server_test.with_context()

  let version = 999
  let assert Error(lgpd.PolicyNotFound(returned)) =
    lgpd.get_policy(context.database, version:)

  assert returned == version

  Nil
}

pub fn get_policy_invalid_version_test() -> Nil {
  use context <- server_test.with_context()

  let version = 0
  let assert Error(lgpd.InvalidPolicyVersion(returned)) =
    lgpd.get_policy(context.database, version:)

  assert returned == version

  Nil
}

pub fn get_current_policy_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(returned) = lgpd.get_current_policy(context.database)
  assert returned
    == lgpd.Policy(
      version: 1,
      document_url: "http://localhost:3000/privacidade",
      document_hash: string.repeat("0", 64),
      published_at: returned.published_at,
      is_current: True,
    )

  Nil
}

pub fn get_current_policy_after_register_test() -> Nil {
  use context <- server_test.with_context()

  let version = 2
  let document_url = "http://localhost:3000/privacidade-v2"
  let document_hash = "wibble"
  let assert Ok(registered) =
    lgpd.register_new_policy(
      context.database,
      version,
      document_url,
      document_hash,
    )

  let assert Ok(returned) = lgpd.get_current_policy(context.database)

  assert returned == registered
  assert returned.version == version
  assert returned.document_url == document_url
  assert returned.document_hash == document_hash
  assert returned.is_current

  Nil
}

pub fn get_missing_current_policy_test() -> Nil {
  use context <- server_test.with_context()

  // There is always a current policy from the seed data, we need to remove it
  let assert Ok(_) =
    pog.query("UPDATE lgpd_policy SET is_current = FALSE;")
    |> pog.execute(context.database)

  let assert Error(lgpd.CurrentPolicyNotFound) =
    lgpd.get_current_policy(context.database)

  Nil
}

pub fn register_new_policy_test() -> Nil {
  use context <- server_test.with_context()

  let version = 2
  let document_url = "http://localhost:3000/privacidade-v2"
  let document_hash = "wibble"

  let assert Ok(returned) =
    lgpd.register_new_policy(
      context.database,
      version,
      document_url,
      document_hash,
    )

  assert returned
    == lgpd.Policy(
      version:,
      document_url:,
      document_hash:,
      published_at: returned.published_at,
      is_current: True,
    )

  Nil
}

pub fn register_new_policy_marks_previous_as_inactive_test() -> Nil {
  use context <- server_test.with_context()

  let version = 2
  let document_url = "http://localhost:3000/privacidade-v2"
  let document_hash = "wibble"

  let assert Ok(registered) =
    lgpd.register_new_policy(
      context.database,
      version,
      document_url,
      document_hash,
    )

  // The previous policy should no longer be the current one.
  let assert Ok(previous) = lgpd.get_policy(context.database, version: 1)
  assert previous.version == 1
  assert previous.is_current == False

  // The newly registered policy should be the current one.
  let assert Ok(current) = lgpd.get_current_policy(context.database)
  assert current == registered
  assert current.version == version

  Nil
}

pub fn register_new_policy_conflict_test() -> Nil {
  use context <- server_test.with_context()

  // Version 1 is inserted by the seed data.
  let version = 1
  let assert Error(lgpd.PolicyVersionConflict(returned)) =
    lgpd.register_new_policy(
      context.database,
      version,
      "http://localhost:3000/privacidade-v2",
      "wibble",
    )

  assert returned == version

  Nil
}

pub fn register_new_policy_invalid_version_test() -> Nil {
  use context <- server_test.with_context()

  let version = 0

  let assert Error(lgpd.InvalidPolicyVersion(returned)) =
    lgpd.register_new_policy(
      context.database,
      version,
      "http://localhost:3000/privacidade-v2",
      "wibble",
    )

  assert returned == version

  Nil
}

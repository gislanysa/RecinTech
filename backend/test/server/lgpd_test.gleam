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

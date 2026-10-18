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
      policy_version: version,
    )

  assert returned
    == lgpd.Granted(
      subject: lgpd.Startup(startup.id),
      updated_at: returned.updated_at,
      policy_version: version,
    )
}

pub fn grant_lgpd_consent_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let version = 1

  let assert Error(lgpd.SubjectNotFound(returned)) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(id),
      policy_version: version,
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
      policy_version: version,
    )

  assert returned == version

  Nil
}

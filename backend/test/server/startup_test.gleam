import gleam/int
import gleam/list
import gleam/uri
import server/dummy
import server/lgpd
import server/startup
import server_test
import youid/uuid

pub fn register_startup_test() -> Nil {
  use context <- server_test.with_context()

  let city = "Recife"
  let cnpj = dummy.new_cnpj()
  let description = "startup muito maneira"
  let email = dummy.new_email()
  let name = "Critic Level"
  let password = "wibble"
  let stage = startup.Traction
  let state = "Pernambuco"
  let website = uri.empty

  let assert Ok(returned) =
    startup.register(
      context.database,
      name:,
      email:,
      password:,
      stage:,
      cnpj:,
      description:,
      city:,
      state:,
      website:,
    )

  assert uuid.version(returned.id) == uuid.V7
  assert returned
    == startup.Startup(
      id: returned.id,
      name:,
      email:,
      stage:,
      cnpj:,
      description:,
      city:,
      state:,
      created_at: returned.created_at,
      is_active: True,
      website:,
    )

  Nil
}

pub fn register_cnpj_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let email = dummy.new_email()
  let cnpj = dummy.new_cnpj()

  let assert Ok(_startup) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wibble",
      stage: startup.Traction,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  let email = dummy.new_email()
  let assert Error(startup.CnpjConflict(returned)) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wobble",
      stage: startup.Traction,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  assert returned == cnpj as "returned conflicted CNPJ"

  Nil
}

pub fn register_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let email = dummy.new_email()
  let cnpj = dummy.new_cnpj()
  let assert Ok(_startup) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wibble",
      stage: startup.Traction,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  let cnpj = dummy.new_cnpj()
  let assert Error(startup.EmailConflict(returned)) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wobble",
      stage: startup.Traction,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
      website: uri.empty,
    )

  assert returned == email as "returned conflicted Email"

  Nil
}

pub fn verify_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let assert Ok(returned) =
    startup.verify(
      context.database,
      email: startup.email,
      password: dummy.password,
    )

  assert returned == startup

  Nil
}

pub fn verify_startup_wrong_password_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let assert Error(startup.WrongPassword) =
    startup.verify(
      context.database,
      email: startup.email,
      password: "not-the-password",
    )

  Nil
}

pub fn verify_startup_missing_email_test() -> Nil {
  use context <- server_test.with_context()

  let email = dummy.new_email()
  let assert Error(startup.EmailNotFound(returned)) =
    startup.verify(context.database, email: email, password: "not-the-password")

  assert returned == email

  Nil
}

pub fn get_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let assert Ok(returned) = startup.get(context.database, startup.id)

  assert returned == startup as "returned correct startup"

  Nil
}

pub fn get_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  // Random ID
  let id = uuid.v7()

  let assert Error(startup.NotFound(returned)) =
    startup.get(context.database, id)

  assert returned == id

  Nil
}

pub fn assign_segment_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  let assert Ok(returned) =
    startup.assign_segment(context.database, startup.id, assign: segment.id)

  assert returned == segment

  Nil
}

pub fn segment_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  // Assigning once
  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment.id)

  // Assigning twice, this one must return an Error.
  let assert Error(startup.AssignmentConflict(returned)) =
    startup.assign_segment(context.database, startup.id, assign: segment.id)

  assert returned == segment.id

  Nil
}

pub fn assign_segment_to_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let segment = dummy.new_segment(context.database)

  let assert Error(startup.NotFound(returned)) =
    startup.assign_segment(context.database, id, assign: segment.id)

  assert returned == id

  Nil
}

/// You must not be able to assign Segments that are not registered.
pub fn assign_missing_segment_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)

  let id = uuid.v7()
  let assert Error(startup.AssignedMissingEntity(returned)) =
    startup.assign_segment(context.database, startup.id, assign: id)

  assert returned == id

  Nil
}

pub fn get_startup_segments_test() -> Nil {
  use context <- server_test.with_context()

  // First one
  let segment_a = dummy.new_segment(context.database)
  let segment_b = dummy.new_segment(context.database)

  let startup = dummy.new_startup(context.database)

  // Assigning first segment
  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment_a.id)

  // Assigning a second segment
  let assert Ok(_) =
    startup.assign_segment(context.database, startup.id, assign: segment_b.id)

  let assert Ok(returned) =
    startup.get_segments(context.database, from: startup.id)

  assert returned == [segment_a, segment_b]

  Nil
}

pub fn ensure_exists_test() -> Nil {
  use context <- server_test.with_context()

  let missing_startup_id = uuid.v7()

  // The query should early return to avoid interacting with a Startup
  // that does not exist.
  let assert Error(startup.NotFound(returned)) = {
    use <- startup.ensure_exists(context.database, missing_startup_id)

    Ok(Nil)
    // ^^^ Depite the callback function ending with an Ok(_), this function
    // should always return an Error(_) since the Startup does not exist.
  }

  // The error should include the given ID in his payload
  assert returned == missing_startup_id

  Nil
}

pub fn assign_startup_to_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(returned) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  assert returned == expertise

  Nil
}

pub fn assign_missing_startup_to_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let expertise = dummy.new_expertise(context.database)

  let id = uuid.v7()
  let assert Error(startup.NotFound(returned)) =
    startup.assign_expertise(context.database, id, assign: expertise.id)

  assert returned == id

  Nil
}

pub fn assign_startup_to_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)

  let id = uuid.v7()
  let assert Error(startup.AssignedMissingEntity(returned)) =
    startup.assign_expertise(context.database, startup.id, assign: id)

  assert returned == id

  Nil
}

pub fn expertise_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(_) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  // You can not assign the same expertise twice
  let assert Error(startup.AssignmentConflict(returned)) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  assert returned == expertise.id

  Nil
}

pub fn get_many_startup_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let startups =
    int.range(from: 1, to: max, with: [], run: fn(acc, _) {
      let startup = dummy.new_startup(context.database)
      [startup, ..acc]
    })
    |> list.reverse

  let assert Ok(returned) =
    startup.get_many(context.database, limit: max, offset: 0)

  assert returned == startups

  Nil
}

pub fn get_lgpd_consent_multiple_policies_versions_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)

  // Version one
  let assert Ok(policy_version_one) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(id: startup.id),
      version: 1,
    )

  // Version two
  let assert Ok(policy_version_two) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(id: startup.id),
      version: 2,
    )

  let assert Ok(returned) =
    startup.get_lgpd_consent(context.database, startup.id)

  assert returned == [policy_version_one, policy_version_two]

  Nil
}

pub fn get_lgpd_consent_upsert_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)

  // This one will be removed.
  let assert Ok(old) =
    lgpd.revoke_consent(
      context.database,
      from: lgpd.Startup(id: startup.id),
      version: 1,
    )

  // Upsert value and set new timestamp.
  let assert Ok(new) =
    lgpd.grant_consent(
      context.database,
      for: lgpd.Startup(id: startup.id),
      version: 1,
    )

  let assert Ok(returned) =
    startup.get_lgpd_consent(context.database, startup.id)

  assert returned != [old]
  assert returned == [new]

  Nil
}

pub fn unassign_segment_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let segment = dummy.new_segment(context.database)

  let assert Ok(assigned) =
    startup.assign_segment(context.database, startup.id, assign: segment.id)

  assert assigned.id == segment.id

  let assert Ok(deleted) =
    startup.unassign_segment(
      context.database,
      startup.id,
      unassign: assigned.id,
    )
  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = startup.get_segments(context.database, startup.id)

  Nil
}

pub fn unassign_missing_segment_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let assert Error(startup.AssignmentNotFound(returned)) =
    startup.unassign_segment(context.database, startup.id, unassign: missing_id)

  assert returned == missing_id

  Nil
}

pub fn unassign_segment_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let segment = dummy.new_segment(context.database)

  let assert Error(startup.AssignmentNotFound(returned)) =
    startup.unassign_segment(context.database, missing_id, unassign: segment.id)

  assert returned == segment.id

  Nil
}

pub fn unassign_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let expertise = dummy.new_expertise(context.database)

  let assert Ok(assigned) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  assert assigned.id == expertise.id

  let assert Ok(deleted) =
    startup.unassign_expertise(
      context.database,
      startup.id,
      unassign: assigned.id,
    )

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = startup.get_expertises(context.database, startup.id)

  Nil
}

pub fn unassign_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let assert Error(startup.AssignmentNotFound(returned)) =
    startup.unassign_expertise(
      context.database,
      startup.id,
      unassign: missing_id,
    )

  assert returned == missing_id

  Nil
}

pub fn unassign_service_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let service = dummy.new_service(context.database)

  let assert Ok(assigned) =
    startup.assign_service(context.database, startup.id, assign: service.id)

  assert assigned.id == service.id

  let assert Ok(deleted) =
    startup.unassign_service(
      context.database,
      startup.id,
      unassign: assigned.id,
    )

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = startup.get_services(context.database, startup.id)

  Nil
}

pub fn unassign_missing_service_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let assert Error(startup.AssignmentNotFound(returned)) =
    startup.unassign_service(context.database, startup.id, unassign: missing_id)

  assert returned == missing_id

  Nil
}

pub fn unassign_technology_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let technology = dummy.new_technology(context.database)

  let assert Ok(assigned) =
    startup.assign_technology(
      context.database,
      startup.id,
      assign: technology.id,
    )

  assert assigned.id == technology.id

  let assert Ok(deleted) =
    startup.unassign_technology(
      context.database,
      startup.id,
      unassign: assigned.id,
    )

  assert deleted.id == assigned.id

  // It should no longer be assigned
  let assert Ok([]) = startup.get_technologies(context.database, startup.id)

  Nil
}

pub fn unassign_missing_technology_test() -> Nil {
  use context <- server_test.with_context()

  let startup = dummy.new_startup(context.database)
  let missing_id = uuid.v7()

  let assert Error(startup.AssignmentNotFound(returned)) =
    startup.unassign_technology(
      context.database,
      startup.id,
      unassign: missing_id,
    )

  assert returned == missing_id

  Nil
}

import gleam/int
import gleam/list
import server/dummy
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
  let stage = startup.Seed
  let state = "Pernambuco"

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
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  let email = dummy.new_email()
  let assert Error(startup.CnpjConflict(returned)) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wobble",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
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
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  let cnpj = dummy.new_cnpj()
  let assert Error(startup.EmailConflict(returned)) =
    startup.register(
      context.database,
      name: "startup",
      email: email,
      password: "wobble",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
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

  assert returned == segment.id

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

  assert returned == expertise.id

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
  let half = max / 2

  let startups =
    int.range(from: 1, to: max, with: [], run: fn(acc, _) {
      let startup = dummy.new_startup(context.database)
      [startup, ..acc]
    })

  // First we get the first three startups
  let assert Ok(first_half) =
    startup.get_many(context.database, limit: half, offset: 0)

  assert list.all(first_half, list.contains(startups, _))

  // Then we get the other three
  let assert Ok(second_half) =
    startup.get_many(context.database, limit: half, offset: half)

  assert list.all(second_half, list.contains(startups, _))

  // They need to be different
  assert first_half != second_half

  // There are only 6, so this should return an empty list
  let assert Ok([]) = startup.get_many(context.database, limit: 3, offset: max)

  Nil
}

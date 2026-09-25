import gleam/int
import gleam/list
import server/cnpj
import server/email
import server/segment
import server/startup
import server/startup/expertise
import server/user
import server_test
import youid/uuid

pub fn register_startup_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Critic Level"
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let description = "startup muito maneira"
  let city = "Recife"
  let state = "Pernambuco"

  let assert Ok(returned) =
    startup.register(
      context.database,
      name: name,
      stage: startup.Seed,
      cnpj: cnpj,
      description: description,
      city: city,
      state: state,
    )

  assert returned.name == name
  assert returned.cnpj == cnpj
  assert returned.description == description
  assert returned.city == city
  assert returned.state == state

  Nil
}

pub fn register_cnpj_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(want) = cnpj.parse("12345678901234")
  let assert Ok(_startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: want,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  let assert Error(startup.CnpjConflict(returned)) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: want,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  assert returned == want as "returned conflicted CNPJ"

  Nil
}

pub fn get_startup_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(want) =
    startup.register(
      context.database,
      name: "Critic Level",
      stage: startup.Seed,
      cnpj:,
      description: "startup muito maneira",
      city: "Recife",
      state: "Pernambuco",
    )

  let assert Ok(returned) = startup.get(context.database, want.id)
  assert returned == want as "returned correct startup"

  Nil
}

pub fn get_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  // Random ID
  let want = uuid.v7()

  let assert Error(startup.NotFound(returned)) =
    startup.get(context.database, want)

  assert returned == want as "returned id of non existing startup"

  Nil
}

pub fn assign_members_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  // Member
  let assert Ok(email) = email.parse("user@email.com")
  let assert Ok(member) =
    user.register(
      context.database,
      full_name: "dummy",
      email:,
      password: "password",
    )

  let assert Ok(returned) =
    startup.assign_member(context.database, startup.id, assign: member.id)

  assert returned == member.id as "return assigned member id"

  Nil
}

pub fn member_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  // Startup
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "description",
      city: "Recife",
      state: "PE",
    )

  // User
  let assert Ok(email) = email.parse("user@email.com")
  let assert Ok(member) =
    user.register(
      context.database,
      full_name: "dummy",
      email:,
      password: "password",
    )

  // Assigning once
  let assert Ok(_) =
    startup.assign_member(context.database, startup.id, assign: member.id)

  // Assigning twice, this should return an Error
  let assert Error(startup.AssignmentConflict(id)) =
    startup.assign_member(context.database, startup.id, assign: member.id)

  assert id == member.id as "returned conflicted user id"

  Nil
}

/// You must not be able to assign Users to a startup that isn't registered.
pub fn assign_users_to_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")
  let assert Ok(user) =
    user.register(context.database, "dummy", email, "password")

  let missing_startup = uuid.v7()
  let assert Error(startup.NotFound(returned)) =
    startup.assign_member(context.database, missing_startup, assign: user.id)

  assert returned == missing_startup as "returned missing startup id"

  Nil
}

/// You must not be able to assign Users that are not registered.
pub fn assign_missing_users_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "some description",
      city: "Recife",
      state: "PE",
    )

  let id = uuid.v7()
  let assert Error(startup.AssignedMissingEntity(returned)) =
    startup.assign_member(context.database, startup.id, assign: id)

  assert id == returned

  Nil
}

pub fn assign_segment_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  // Assigning this segment
  let assert Ok(want) =
    segment.register(
      context.database,
      name: "iot",
      description: "embedded devices are cool",
    )

  // To this startup
  let assert Ok(cnpj) = cnpj.parse("12345678910123")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "cool iot startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "really cool",
      city: "Recife",
      state: "PE",
    )

  // We can assign more than one but in this test we are using a single ID
  let assert Ok(got) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: want.id,
      as_main_segment: False,
    )

  assert got == want.id as "should return a successfully assigned segment"

  Nil
}

pub fn segment_assignment_conflict_test() -> Nil {
  use context <- server_test.with_context()

  // Segment
  let assert Ok(want) =
    segment.register(
      context.database,
      name: "iot",
      description: "embedded devices are cool",
    )

  // Startup
  let assert Ok(cnpj) = cnpj.parse("12345678910123")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "cool iot startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "really cool",
      city: "Recife",
      state: "PE",
    )

  // Assigning once
  let assert Ok(_) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: want.id,
      as_main_segment: False,
    )

  // Assigning twice, this one must return an Error.
  let assert Error(startup.AssignmentConflict(returned)) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: want.id,
      as_main_segment: True,
    )

  assert returned == want.id as "returned conflicted segment"

  Nil
}

pub fn assign_segment_to_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let want = uuid.v7()
  let assert Ok(segment) =
    segment.register(context.database, name: "gaming", description: "yes")

  let assert Error(startup.NotFound(returned)) =
    startup.assign_segment(
      context.database,
      want,
      assign: segment.id,
      as_main_segment: True,
    )

  assert returned == want as "returned missing startup id"

  Nil
}

/// You must not be able to assign Segments that are not registered.
pub fn assign_missing_segment_to_startup_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "some description",
      city: "Recife",
      state: "PE",
    )

  let id = uuid.v7()
  let assert Error(startup.AssignedMissingEntity(returned)) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: id,
      as_main_segment: True,
    )

  assert returned == id

  Nil
}

pub fn get_startup_segments_test() -> Nil {
  use context <- server_test.with_context()

  // First one
  let assert Ok(segment_iot) =
    segment.register(
      context.database,
      name: "iot",
      description: "embedded devices are cool",
    )

  // Second one
  let assert Ok(segment_cloud) =
    segment.register(
      context.database,
      name: "cloud",
      description: "something something",
    )

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "some description",
      city: "Recife",
      state: "PE",
    )

  // Assigning first segment
  let assert Ok(_) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: segment_iot.id,
      as_main_segment: True,
    )

  // Assigning a second segment
  let assert Ok(_) =
    startup.assign_segment(
      context.database,
      startup.id,
      assign: segment_cloud.id,
      as_main_segment: False,
    )

  let assert Ok(got) = startup.get_segments(context.database, from: startup.id)

  // Returned list should contain both segments
  assert list.contains(got, segment_iot)
  assert list.contains(got, segment_cloud)

  Nil
}

pub fn get_startup_members_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "startup",
      stage: startup.Seed,
      cnpj: cnpj,
      description: "some description",
      city: "Recife",
      state: "PE",
    )

  // First User
  let assert Ok(wibble_email) = email.parse("wibble@email.com")
  let assert Ok(wibble_user) =
    user.register(
      context.database,
      full_name: "wibble",
      email: wibble_email,
      password: "password",
    )

  // Second User
  let assert Ok(wobble_email) = email.parse("wobble@email.com")
  let assert Ok(wobble_user) =
    user.register(
      context.database,
      full_name: "wobble",
      email: wobble_email,
      password: "password",
    )

  // Assigning both
  let assert Ok(_) =
    startup.assign_member(context.database, startup.id, assign: wibble_user.id)
  let assert Ok(_) =
    startup.assign_member(context.database, startup.id, assign: wobble_user.id)

  // This should return both of them
  let assert Ok(returned) = startup.get_members(context.database, startup.id)
  assert list.contains(returned, wibble_user)
  assert list.contains(returned, wobble_user)

  Nil
}

pub fn ensure_exists_test() -> Nil {
  use context <- server_test.with_context()

  let missing_startup_id = uuid.v7()

  // The query should early return to avoid interacting with a Startup
  // that does not exist.
  let assert Error(startup.NotFound(got)) = {
    use <- startup.ensure_exists(context.database, missing_startup_id)

    Ok(Nil)
    // ^^^ Depite the callback function ending with an Ok(_), this function
    // should always return an Error(_) since the Startup does not exist.
  }

  // The error should include the given ID in his payload
  assert got == missing_startup_id as "return missing startup id"

  Nil
}

pub fn assign_startup_to_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("00000000000000")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Virada no cafe",
      stage: startup.Growth,
      cnpj:,
      description: ":)",
      city: "Olinda",
      state: "PE",
    )

  let assert Ok(expertise) =
    expertise.register(
      context.database,
      name: "Web Development",
      description: "",
    )

  let assert Ok(returned) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  assert returned == expertise.id

  Nil
}

pub fn assign_missing_startup_to_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(expertise) =
    expertise.register(
      context.database,
      name: "Web Development",
      description: "",
    )

  let id = uuid.v7()
  let assert Error(startup.NotFound(returned)) =
    startup.assign_expertise(context.database, id, assign: expertise.id)

  assert returned == id as "returned id of the missing startup"

  Nil
}

pub fn assign_startup_to_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("00000000000000")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Virada no cafe",
      stage: startup.Growth,
      cnpj:,
      description: ":)",
      city: "Olinda",
      state: "PE",
    )

  let id = uuid.v7()
  let assert Error(startup.AssignedMissingEntity(returned)) =
    startup.assign_expertise(context.database, startup.id, assign: id)

  assert returned == id as "returned id of the missing expertise"

  Nil
}

pub fn expertise_assignment_conflict() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(cnpj) = cnpj.parse("00000000000000")
  let assert Ok(startup) =
    startup.register(
      context.database,
      name: "Virada no cafe",
      stage: startup.Growth,
      cnpj:,
      description: ":)",
      city: "Olinda",
      state: "PE",
    )

  let assert Ok(expertise) =
    expertise.register(
      context.database,
      name: "Web Development",
      description: "",
    )

  let assert Ok(returned) =
    startup.assign_expertise(context.database, startup.id, assign: expertise.id)

  assert returned == expertise.id

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
    int.range(from: 1, to: max, with: [], run: fn(acc, num) {
      let assert Ok(cnpj) = cnpj.parse("0000000000000" <> int.to_string(num))
      let assert Ok(startup) =
        startup.register(
          context.database,
          name: "dummy " <> int.to_string(num),
          stage: startup.Seed,
          cnpj:,
          description: "",
          city: "Recife",
          state: "PE",
        )

      [startup, ..acc]
    })

  // First we get the first three startups
  let assert Ok(first_half) =
    startup.get_many(context.database, limit: half, offset: 0)

  let assert Ok(_) =
    list.try_each(first_half, fn(startup) {
      case list.contains(startups, startup) {
        True -> Ok(Nil)
        False -> Error(Nil)
      }
    })

  // Then we get the other three
  let assert Ok(second_half) =
    startup.get_many(context.database, limit: half, offset: half)

  let assert Ok(_) =
    list.try_each(second_half, fn(startup) {
      case list.contains(startups, startup) {
        True -> Ok(Nil)
        False -> Error(Nil)
      }
    })

  // They need to be different
  assert first_half != second_half

  // There are only 6, so this should return an empty list
  let assert Ok([]) = startup.get_many(context.database, limit: 3, offset: max)

  Nil
}

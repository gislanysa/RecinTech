import server/startup/expertise
import server_test
import youid/uuid

pub fn register_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Health"
  let description = "Medic stuff"
  let assert Ok(got) = expertise.register(context.database, name:, description:)

  assert got == expertise.Expertise(id: got.id, name:, description:)

  Nil
}

pub fn get_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(want) =
    expertise.register(
      context.database,
      name: "Health",
      description: "Medic stuff",
    )

  let assert Ok(returned) = expertise.get(context.database, want.id)
  assert returned == want as "returned correct expertise"

  Nil
}

pub fn get_missing_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(expertise.NotFound(returned)) =
    expertise.get(context.database, id)
  assert returned == id as "returned missing expertise"

  Nil
}

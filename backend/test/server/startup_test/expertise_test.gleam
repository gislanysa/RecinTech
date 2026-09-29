import server/dummy
import server/startup/expertise
import server_test
import youid/uuid

pub fn register_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Health"
  let description = "Medic stuff"
  let assert Ok(returned) =
    expertise.register(context.database, name:, description:)

  assert uuid.version(returned.id) == uuid.V7
  assert returned == expertise.Expertise(id: returned.id, name:, description:)

  Nil
}

pub fn get_expertise_test() -> Nil {
  use context <- server_test.with_context()

  let expertise = dummy.new_expertise(context.database)
  let assert Ok(returned) = expertise.get(context.database, expertise.id)

  assert returned == expertise

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

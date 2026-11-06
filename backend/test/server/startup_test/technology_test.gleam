import server/dummy
import server/technology
import server_test
import youid/uuid

pub fn register_technology_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Javascript"
  let description = "don't"
  let assert Ok(returned) =
    technology.register(context.database, name:, description:)

  assert uuid.version(returned.id) == uuid.V7
  assert returned == technology.Technology(id: returned.id, name:, description:)

  Nil
}

pub fn get_technology_test() -> Nil {
  use context <- server_test.with_context()

  let technology = dummy.new_technology(context.database)
  let assert Ok(returned) = technology.get(context.database, technology.id)

  assert returned == technology

  Nil
}

pub fn get_missing_technology_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(technology.NotFound(returned)) =
    technology.get(context.database, id)

  assert returned == id

  Nil
}

pub fn get_many_technologies_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let technologies =
    dummy.many(max, fn() { dummy.new_technology(context.database) })

  let assert Ok(returned) =
    technology.get_many(context.database, limit: max, offset: 0)

  assert returned == technologies

  Nil
}

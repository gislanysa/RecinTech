import server/startup/technology
import server_test
import youid/uuid

pub fn register_technology_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Javascript"
  let description = "don't"
  let assert Ok(got) =
    technology.register(context.database, name:, description:)

  assert got == technology.Technology(id: got.id, name:, description:)

  Nil
}

pub fn get_technology_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(want) =
    technology.register(
      context.database,
      name: "Go",
      description: "this one is cool sometimes",
    )

  let assert Ok(returned) = technology.get(context.database, want.id)
  assert returned == want as "returned correct technology"

  Nil
}

pub fn get_missing_technology_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(technology.NotFound(returned)) =
    technology.get(context.database, id)

  assert returned == id as "returned missing technology"

  Nil
}

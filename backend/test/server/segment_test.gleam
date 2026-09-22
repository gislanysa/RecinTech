import server/segment
import server_test
import youid/uuid

pub fn register_segment_test() -> Nil {
  use context <- server_test.with_context()
  let name = "tech"
  let description = "modern technology"

  let assert Ok(segment) =
    segment.register(context.database, name:, description:)

  assert segment.name == name
  assert segment.description == description

  Nil
}

pub fn get_segment_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(want) =
    segment.register(context.database, name: "wibble", description: "wobble")

  let assert Ok(got) = segment.get(context.database, want.id)

  assert got == want

  Nil
}

pub fn get_missing_segment_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(segment.NotFound(returned)) =
    segment.get(context.database, id)

  assert id == returned

  Nil
}

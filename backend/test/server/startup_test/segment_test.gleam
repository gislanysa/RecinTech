import gleam/int
import gleam/list
import server/dummy
import server/segment
import server_test
import youid/uuid

pub fn register_segment_test() -> Nil {
  use context <- server_test.with_context()
  let name = "tech"
  let description = "modern technology"

  let assert Ok(returned) =
    segment.register(context.database, name:, description:)

  assert uuid.version(returned.id) == uuid.V7
  assert returned == segment.Segment(id: returned.id, name:, description:)

  Nil
}

pub fn get_segment_test() -> Nil {
  use context <- server_test.with_context()

  let segment = dummy.new_segment(context.database)
  let assert Ok(returned) = segment.get(context.database, segment.id)

  assert returned == segment

  Nil
}

pub fn get_missing_segment_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(segment.NotFound(returned)) =
    segment.get(context.database, id)

  assert returned == id

  Nil
}

pub fn get_many_segments_test() -> Nil {
  use context <- server_test.with_context()
  let max = 6

  let segments =
    int.range(from: 1, to: max, with: [], run: fn(acc, _) {
      let segment = dummy.new_segment(context.database)
      [segment, ..acc]
    })
    |> list.reverse

  let assert Ok(returned) =
    segment.get_many(context.database, limit: max, offset: 0)

  assert returned == segments

  Nil
}

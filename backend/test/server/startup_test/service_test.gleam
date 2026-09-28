import server/dummy
import server/startup/service
import server_test
import youid/uuid

pub fn register_service_test() -> Nil {
  use context <- server_test.with_context()

  let name = "Web Development"
  let description = "Pretty good with websites"
  let assert Ok(returned) =
    service.register(context.database, name:, description:)

  assert returned == service.Service(id: returned.id, name:, description:)
    as "return correct service"

  Nil
}

pub fn get_service_test() -> Nil {
  use context <- server_test.with_context()

  let service = dummy.new_service(context.database)
  let assert Ok(returned) = service.get(context.database, service.id)

  assert returned == service

  Nil
}

pub fn get_missing_service_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(service.NotFound(returned)) =
    service.get(context.database, id)

  assert returned == id

  Nil
}

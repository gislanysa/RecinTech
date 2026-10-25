import server/company/demand
import server/dummy
import server_test
import youid/uuid

pub fn register_demand_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let title = "dummy"
  let description = "description"
  let status = demand.Open

  let assert Ok(demand) =
    demand.register(
      context.database,
      company_id: company.id,
      title:,
      description:,
      status:,
    )

  assert demand.company_id == company.id
  assert demand.title == title
  assert demand.description == description
  assert demand.status == status

  Nil
}

pub fn register_demand_missing_company_test() -> Nil {
  use context <- server_test.with_context()

  let missing_id = uuid.v7()
  let assert Error(demand.CompanyNotFound(returned)) =
    demand.register(
      context.database,
      company_id: missing_id,
      title: "dummy",
      description: "dummy",
      status: demand.Open,
    )

  assert returned == missing_id

  Nil
}

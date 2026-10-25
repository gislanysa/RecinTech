import gleam/uri
import server/cnpj
import server/company
import server/dummy
import server/email
import server_test
import youid/uuid

pub fn register_company_test() -> Nil {
  use context <- server_test.with_context()

  let name = "test"
  let size = company.Micro
  let assert Ok(email) = email.parse("wibble@email.com")
  let assert Ok(cnpj) = cnpj.parse("12345678901234")
  let password = "wibble"
  let city = "Recife"
  let state = "PE"
  let assert Ok(website) = uri.parse("https://wibble.com")

  let assert Ok(returned) =
    company.register(
      context.database,
      name:,
      size:,
      email:,
      cnpj:,
      password:,
      city:,
      state:,
      website:,
    )

  assert returned
    == company.Company(
      id: returned.id,
      name:,
      size:,
      email:,
      cnpj:,
      city:,
      state:,
      created_at: returned.created_at,
      is_active: returned.is_active,
      website:,
    )
}

pub fn get_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)

  let assert Ok(returned) = company.get(context.database, company.id)
  assert returned.id == company.id

  Nil
}

pub fn get_company_demands_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)

  let demand_a = dummy.new_demand(context.database, from: company.id)
  let demand_b = dummy.new_demand(context.database, from: company.id)

  let assert Ok(returned) =
    company.get_demands(
      context.database,
      from: company.id,
      limit: 100,
      offset: 0,
    )

  assert returned == [demand_a, demand_b]

  Nil
}

pub fn get_missing_company_demands_test() -> Nil {
  use context <- server_test.with_context()

  let company_id = uuid.v7()
  let assert Ok([]) =
    company.get_demands(
      context.database,
      from: company_id,
      limit: 100,
      offset: 0,
    )

  Nil
}

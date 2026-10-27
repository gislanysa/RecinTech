import gleam/option
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
      updated_at: returned.updated_at,
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

pub fn update_company_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let assert Ok(new_email) = email.parse("updated@email.com")
  let assert Ok(new_website) = uri.parse("https://updated.com")

  let assert Ok(returned) =
    company.update(
      context.database,
      company.id,
      new_name: option.Some("Updated Company"),
      new_size: option.Some(company.Big),
      new_email: option.Some(new_email),
      new_cnpj: option.None,
      new_city: option.Some("Olinda"),
      new_state: option.Some("PE"),
      new_website: option.Some(new_website),
    )

  assert returned.id == company.id
  assert returned.name == "Updated Company"
  assert returned.size == company.Big
  assert returned.email == new_email
  assert returned.city == "Olinda"
  assert returned.state == "PE"
  assert returned.website == new_website

  Nil
}

pub fn update_company_empty_strings_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)

  let assert Ok(returned) =
    company.update(
      context.database,
      company.id,
      new_name: option.Some(""),
      new_size: option.None,
      new_email: option.None,
      new_cnpj: option.None,
      new_city: option.Some(""),
      new_state: option.None,
      new_website: option.None,
    )

  assert returned.id == company.id
  assert returned.name == company.name
  assert returned.city == company.city

  Nil
}

pub fn update_missing_company_test() -> Nil {
  use context <- server_test.with_context()

  let company_id = uuid.v7()

  let assert Error(company.NotFound(id)) =
    company.update(
      context.database,
      company_id,
      new_name: option.Some("test"),
      new_size: option.None,
      new_email: option.None,
      new_cnpj: option.None,
      new_city: option.None,
      new_state: option.None,
      new_website: option.None,
    )

  assert id == company_id

  Nil
}

pub fn update_company_cnpj_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company_a = dummy.new_company(context.database)
  let company_b = dummy.new_company(context.database)

  let assert Error(company.CnpjConflict(cnpj)) =
    company.update(
      context.database,
      company_b.id,
      new_name: option.None,
      new_size: option.None,
      new_email: option.None,
      new_cnpj: option.Some(company_a.cnpj),
      new_city: option.None,
      new_state: option.None,
      new_website: option.None,
    )

  assert cnpj == company_a.cnpj

  Nil
}

pub fn update_company_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company_a = dummy.new_company(context.database)
  let company_b = dummy.new_company(context.database)

  let assert Error(company.EmailConflict(email)) =
    company.update(
      context.database,
      company_b.id,
      new_name: option.None,
      new_size: option.None,
      new_email: option.Some(company_a.email),
      new_cnpj: option.None,
      new_city: option.None,
      new_state: option.None,
      new_website: option.None,
    )

  assert email == company_a.email

  Nil
}

import gleam/list
import gleam/option.{None, Some}
import gleam/uri
import server/cnpj
import server/company
import server/connection
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
      new_name: Some("Updated Company"),
      new_size: Some(company.Big),
      new_email: Some(new_email),
      new_cnpj: None,
      new_city: Some("Olinda"),
      new_state: Some("PE"),
      new_website: Some(new_website),
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
      new_name: Some(""),
      new_size: None,
      new_email: None,
      new_cnpj: None,
      new_city: Some(""),
      new_state: None,
      new_website: None,
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
      new_name: Some("test"),
      new_size: None,
      new_email: None,
      new_cnpj: None,
      new_city: None,
      new_state: None,
      new_website: None,
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
      new_name: None,
      new_size: None,
      new_email: None,
      new_cnpj: Some(company_a.cnpj),
      new_city: None,
      new_state: None,
      new_website: None,
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
      new_name: None,
      new_size: None,
      new_email: Some(company_a.email),
      new_cnpj: None,
      new_city: None,
      new_state: None,
      new_website: None,
    )

  assert email == company_a.email

  Nil
}

pub fn request_connection_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)

  let assert Ok(returned) =
    company.request_connection(context.database, company.id, to: startup.id)

  // a new connection is always pending until the startup responds to it.
  assert returned
    == connection.Connection(
      company: company.id,
      startup: startup.id,
      status: connection.Pending,
      created_at: returned.created_at,
      updated_at: returned.updated_at,
    )

  Nil
}

pub fn request_connection_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup = dummy.new_startup(context.database)

  // Requesting once
  let assert Ok(_) =
    company.request_connection(context.database, company.id, to: startup.id)

  // Requesting twice, this one must return an Error.
  let assert Error(company.ConnectionConflict(returned)) =
    company.request_connection(context.database, company.id, to: startup.id)

  assert returned == startup.id

  Nil
}

pub fn request_connection_missing_company_test() -> Nil {
  use context <- server_test.with_context()

  let company_id = uuid.v7()
  let startup = dummy.new_startup(context.database)

  let assert Error(company.NotFound(returned)) =
    company.request_connection(context.database, company_id, to: startup.id)

  assert returned == company_id

  Nil
}

pub fn request_connection_missing_startup_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup_id = uuid.v7()

  let assert Error(company.StartupNotFound(returned)) =
    company.request_connection(context.database, company.id, to: startup_id)

  assert returned == startup_id

  Nil
}

pub fn get_company_connections_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup_a = dummy.new_startup(context.database)
  let startup_b = dummy.new_startup(context.database)

  // The Company requests connections with both Startups
  let assert Ok(requested_a) =
    company.request_connection(context.database, company.id, to: startup_a.id)
  let assert Ok(requested_b) =
    company.request_connection(context.database, company.id, to: startup_b.id)

  let assert Ok(returned) =
    company.get_connections(context.database, company.id, limit: 100, offset: 0)

  // Connections created in the same transaction share their created_at, so
  // their order is not guaranteed
  assert returned == [requested_a, requested_b]
    || returned == [requested_b, requested_a]

  Nil
}

pub fn get_company_connections_pagination_test() -> Nil {
  use context <- server_test.with_context()

  let company = dummy.new_company(context.database)
  let startup_a = dummy.new_startup(context.database)
  let startup_b = dummy.new_startup(context.database)
  let startup_c = dummy.new_startup(context.database)

  // requesting three connections
  let assert Ok(_) =
    company.request_connection(context.database, company.id, to: startup_a.id)
  let assert Ok(_) =
    company.request_connection(context.database, company.id, to: startup_b.id)
  let assert Ok(_) =
    company.request_connection(context.database, company.id, to: startup_c.id)

  // only two connections fit in the first page
  let assert Ok(page) =
    company.get_connections(context.database, company.id, limit: 2, offset: 0)
  assert list.length(page) == 2

  // the last page holds the remaining connection
  let assert Ok(page) =
    company.get_connections(context.database, company.id, limit: 2, offset: 2)
  assert list.length(page) == 1

  // offsetting past every connection returns an empty list
  let assert Ok([]) =
    company.get_connections(context.database, company.id, limit: 2, offset: 10)

  Nil
}

pub fn get_missing_company_connections_test() -> Nil {
  use context <- server_test.with_context()

  let company_id = uuid.v7()

  let assert Ok([]) =
    company.get_connections(context.database, company_id, limit: 100, offset: 0)

  Nil
}

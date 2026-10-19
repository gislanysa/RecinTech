import gleam/uri
import server/cnpj
import server/company
import server/email
import server_test

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

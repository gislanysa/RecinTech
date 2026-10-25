import gleam/uri
import server/cnpj
import server/company
import server/email
import server/startup

pub type Login {
  Login(session: String, email: email.Email, password: String)
}

pub type RegisterStartup {
  RegisterStartup(
    name: String,
    email: email.Email,
    password: String,
    cnpj: cnpj.Cnpj,
    stage: startup.Stage,
    description: String,
    city: String,
    state: String,
    website: uri.Uri,
  )
}

pub type RegisterCompany {
  RegisterCompany(
    name: String,
    size: company.Size,
    email: email.Email,
    password: String,
    cnpj: cnpj.Cnpj,
    city: String,
    state: String,
    website: uri.Uri,
  )
}

pub type UpdateDemand {
  UpdateDemand(title: String, description: String)
}

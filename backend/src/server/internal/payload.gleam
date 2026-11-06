//// Request payload types for API endpoints.

import gleam/option.{type Option}
import gleam/uri
import server/cnpj
import server/company
import server/company/demand
import server/email
import server/startup
import youid/uuid

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

pub type RegisterDemand {
  RegisterDemand(
    title: String,
    description: String,
    status: demand.Status,
    expertises: List(uuid.Uuid),
    segments: List(uuid.Uuid),
    services: List(uuid.Uuid),
    technologies: List(uuid.Uuid),
  )
}

pub type UpdateDemand {
  UpdateDemand(title: String, description: String)
}

pub type UpdateStartup {
  UpdateStartup(
    name: String,
    stage: Option(startup.Stage),
    email: Option(email.Email),
    cnpj: Option(cnpj.Cnpj),
    description: String,
    city: String,
    state: String,
    website: uri.Uri,
  )
}

pub type UpdateCompany {
  UpdateCompany(
    name: String,
    size: Option(company.Size),
    email: Option(email.Email),
    cnpj: Option(cnpj.Cnpj),
    city: String,
    state: String,
    website: uri.Uri,
  )
}

import gleam/uri
import server/cnpj
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

pub type AssignStartupToEntity {
  AssignStartupToSegment(startup: uuid.Uuid, segment: uuid.Uuid)
}

pub type AssignStartupToTechnology {
  AssignStartupToTechnology(startup: uuid.Uuid, technology: uuid.Uuid)
}

pub type AssignStartupToExpertise {
  AssignStartupToExpertise(startup: uuid.Uuid, expertise: uuid.Uuid)
}

pub type AssignStartupToService {
  AssignStartupToService(startup: uuid.Uuid, service: uuid.Uuid)
}

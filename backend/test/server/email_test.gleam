import server/email

pub fn parse_email_test() -> Nil {
  let assert Ok(_) = email.parse("wibble@wobble")
  let assert Ok(_) = email.parse("wibble@wobble.woo")

  let assert Error(email.MissingAt) = email.parse("wibble.dev")
  let assert Error(email.MissingAt) = email.parse("wibble-wobble")

  let assert Error(email.MissingUsername) = email.parse("@wobble.dev")
  let assert Error(email.MissingDomain) = email.parse("wibble@")

  Nil
}

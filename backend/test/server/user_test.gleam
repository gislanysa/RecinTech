import server/user
import server_test
import youid/uuid

pub fn register_user_test() -> Nil {
  use context <- server_test.with_context()

  let name = "user"
  let email = "user@email.com"
  let password = "password"

  let assert Ok(user) = user.register(context.database, name, email, password)
  assert user.full_name == name
  assert user.email == email

  Nil
}

pub fn register_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let email = "user@email.com"

  let assert Ok(_user) = user.register(context.database, "", email, "wibble")
  let assert Error(user.EmailConflict) =
    user.register(context.database, "", email, "wibble")

  Nil
}

pub fn register_invalid_email_test() -> Nil {
  use context <- server_test.with_context()

  let email = "invalid-email"
  let assert Error(user.InvalidEmailFormat) =
    user.register(context.database, "", email, "wibble")

  Nil
}

pub fn verify_user_test() -> Nil {
  use context <- server_test.with_context()

  let email = "user@email.com"
  let password = "password"

  let assert Ok(user) = user.register(context.database, "me", email, password)
  let assert Ok(found) = user.verify(context.database, email, password)

  assert found == user

  Nil
}

pub fn verify_user_incorrect_password_test() -> Nil {
  use context <- server_test.with_context()

  let email = "user@email.com"
  let password = "password"

  let assert Ok(_) = user.register(context.database, "me", email, password)
  let assert Error(user.WrongPassword) =
    user.verify(context.database, email, "pswd")

  Nil
}

pub fn verify_missing_user_test() -> Nil {
  use context <- server_test.with_context()

  let email = "user@email.com"
  let password = "password"

  let assert Error(user.NotFound) =
    user.verify(context.database, email, password)

  Nil
}

pub fn get_user_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(dummy) =
    user.register(context.database, "user", "user@email.com", "123476")

  let assert Ok(found) = user.get(context.database, dummy.id)
  assert found == dummy

  Nil
}

pub fn get_missing_user_test() -> Nil {
  use context <- server_test.with_context()
  let assert Error(user.NotFound) = user.get(context.database, uuid.v7())

  Nil
}

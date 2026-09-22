import server/email
import server/user
import server_test
import youid/uuid

pub fn register_user_test() -> Nil {
  use context <- server_test.with_context()

  let name = "user"
  let assert Ok(email) = email.parse("user@email.com")
  let password = "password"

  let assert Ok(user) =
    user.register(context.database, full_name: name, email: email, password:)

  assert user.full_name == name
  assert user.email == email

  Nil
}

pub fn register_email_conflict_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(want) = email.parse("user@email.com")

  let assert Ok(_user) =
    user.register(
      context.database,
      full_name: "",
      email: want,
      password: "wibble",
    )

  let assert Error(user.EmailConflict(got)) =
    user.register(
      context.database,
      full_name: "",
      email: want,
      password: "wibble",
    )

  assert got == want

  Nil
}

pub fn verify_user_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")
  let password = "password"

  let assert Ok(user) =
    user.register(context.database, full_name: "me", email:, password:)

  let assert Ok(found) = user.verify(context.database, email:, password:)

  assert found == user

  Nil
}

pub fn verify_user_incorrect_password_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")
  let password = "password"

  let assert Ok(_) =
    user.register(context.database, full_name: "me", email:, password:)

  let assert Error(user.WrongPassword) =
    user.verify(context.database, email, "pswd")

  Nil
}

pub fn verify_missing_user_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")
  let password = "password"

  let assert Error(user.EmailNotFound(returned)) =
    user.verify(context.database, email:, password:)

  assert returned == email as "returned missing email"

  Nil
}

pub fn get_user_test() -> Nil {
  use context <- server_test.with_context()

  let assert Ok(email) = email.parse("user@email.com")

  let assert Ok(want) =
    user.register(
      context.database,
      full_name: "user",
      email:,
      password: "123476",
    )

  let assert Ok(found) = user.get(context.database, want.id)
  assert found == want

  Nil
}

pub fn get_missing_user_test() -> Nil {
  use context <- server_test.with_context()

  let id = uuid.v7()
  let assert Error(user.NotFound(returned)) = user.get(context.database, id)

  assert id == returned as "returned missing id"

  Nil
}

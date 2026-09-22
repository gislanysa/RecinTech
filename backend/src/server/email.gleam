//// Email addresses need to be parsed before usage.

import gleam/dynamic/decode
import gleam/result
import gleam/string

/// Email address, stored internally as a lowercase String
pub opaque type Email {
  Email(value: String)
}

/// Parse a String into a valid [Email](#Email) type.
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(email) = email.parse("user@email.com")
/// let assert Error(_) = email.parse("invalid-email")
/// ```
pub fn parse(string: String) -> Result(Email, Nil) {
  use value <- result.map(case string.split_once(string, on: "@") {
    // An email needs to have text before and after the "@"
    // -> "@email.com" and "user@" are not valid email addresses
    Ok(#("", _)) | Ok(#(_, "")) -> Error(Nil)

    // In case "@" sign isn't present
    // -> "user_email.com"
    Error(_) -> Error(Nil)

    // -> "user@email.com"
    Ok(_) -> Ok(string)
  })

  string.trim(value)
  |> string.lowercase
  |> Email
}

/// Convert an [Email](#Email) back into a String.
///
/// ## Examples
///
/// ```gleam
/// let string = email.to_string(email)
/// assert string == "user@email.com"
/// ```
pub fn to_string(self: Email) -> String {
  self.value
}

/// A decoder that decodes `Email` values.
///
/// ## Examples
///
/// ```gleam
/// let result = decode.run(dynamic.string("user@email"), email.decode)
/// assert result == Ok(Email(value: "user@email"))
/// ```
pub fn decoder() {
  use string <- decode.then(decode.string)
  case parse(string) {
    Ok(value) -> decode.success(value)
    Error(_) -> decode.failure(Email(value: "user@email"), "Email")
  }
}

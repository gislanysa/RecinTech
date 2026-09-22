//// CNPJ stands for "Cadastro Nacional da Pessoa Jurídica",
//// companies must have a CNPJ to operate legally. A CNPJ must be
//// exactly 14 characters long.
////
//// ## Format
////
//// ```txt
//// 12 . 345 . 678  /  0001  -  95
//// └────────────┘     └──┘     └┘
//// Base ID            Branch   Check
////                    Number   Digits
//// ```

import gleam/dynamic/decode
import gleam/string

pub type CnpjError {
  /// CNPJ's must be exactly 14 characters long
  InvalidLength(length: Int)
}

pub opaque type Cnpj {
  Cnpj(value: String)
}

/// Parse a String into a valid [Cnpj](#Cnpj) type.
///
/// ## Examples
///
/// ```gleam
/// let assert Ok(cnpj) = cnpj.parse("12345678000105")
/// let assert Error(_) = cnpj.parse("invalid")
/// ```
pub fn parse(string: String) -> Result(Cnpj, CnpjError) {
  let length = string.length(string)

  case length == 14 {
    True -> Ok(Cnpj(value: string))
    False -> Error(InvalidLength(length:))
  }
}

/// Convert an [Cnpj](#Cnpj) back into a String.
///
/// ## Examples
///
/// ```gleam
/// let string = cnpj.to_string(cnpj)
/// assert string == "12345678000105"
/// ```
pub fn to_string(self: Cnpj) -> String {
  self.value
}

/// A decoder that decodes [Cnpj](#Cnpj) values.
///
/// ## Examples
///
/// ```gleam
/// let result = decode.run(dynamic.string("12345678000105"), cnpj.decode)
/// assert result == Ok(Cnpj(value: "12345678000105"))
/// ```
pub fn decoder() -> decode.Decoder(Cnpj) {
  use string <- decode.then(decode.string)
  case parse(string) {
    Ok(value) -> decode.success(value)
    Error(_) -> decode.failure(Cnpj(value: "000000000000"), "CNPJ")
  }
}

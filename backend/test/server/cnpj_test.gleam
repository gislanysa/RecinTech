import server/cnpj

pub fn parse_cnpj_test() -> Nil {
  let assert Ok(_) = cnpj.parse("12345678901234")
  let assert Ok(_) = cnpj.parse("00000000000000")
  let assert Error(cnpj.InvalidLength(6)) = cnpj.parse("wibble")
  let assert Error(cnpj.InvalidLength(0)) = cnpj.parse("")

  Nil
}

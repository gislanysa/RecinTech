import envoy
import filepath
import gleam/erlang/process
import gleam/http/request
import gleam/http/response
import gleam/otp/actor
import gleam/otp/static_supervisor as supervisor
import gleam/result
import mist
import pog
import server/context
import server/router
import wisp
import wisp/wisp_mist

pub fn main() -> Nil {
  wisp.configure_logger()

  //   Postgres
  let db_process_name = process.new_name("db_connection_pool")
  let assert Ok(database_url) = envoy.get("DATABASE_URL")
  let assert Ok(pog_config) = pog.url_config(db_process_name, database_url)
  let database = pog.named_connection(db_process_name)

  // others
  let assert Ok(static_directory) = static_directory()
  let assert Ok(secret_key) = envoy.get("SECRET_KEY")
  let context = context.Context(database:, static_directory:)
  let handler = router.handle_request(_, context)

  // start supervision tree
  let assert Ok(_) = start_supervision_tree(handler, pog_config, secret_key)
  process.sleep_forever()
}

pub fn static_directory() -> Result(String, Nil) {
  use priv_directory <- result.map(wisp.priv_directory("server"))
  filepath.join(priv_directory, "static")
}

type Request =
  request.Request(wisp.Connection)

type Response =
  response.Response(wisp.Body)

pub fn start_supervision_tree(
  http_handler: fn(Request) -> Response,
  database_config: pog.Config,
  secret_key: String,
) -> Result(actor.Started(supervisor.Supervisor), actor.StartError) {
  let http_server =
    wisp_mist.handler(http_handler, secret_key)
    |> mist.new
    |> mist.bind("0.0.0.0")
    |> mist.port(8000)

  supervisor.new(supervisor.OneForOne)
  |> supervisor.add(mist.supervised(http_server))
  |> supervisor.add(pog.supervised(database_config))
  |> supervisor.start
}

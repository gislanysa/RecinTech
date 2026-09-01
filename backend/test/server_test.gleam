import envoy
import gleam/erlang/process
import gleeunit
import global_value
import pog
import server
import server/context

pub fn main() -> Nil {
  gleeunit.main()
}

fn global_context() -> context.Context {
  global_value.create_with_unique_name("server_test.global.data", fn() {
    let db_process_name = process.new_name("database_connection")
    let assert Ok(database_url) = envoy.get("DATABASE_URL")
    let assert Ok(pog_config) = pog.url_config(db_process_name, database_url)
    let database = pog.named_connection(db_process_name)

    // --- Building the Context type
    let assert Ok(static_directory) = server.static_directory()
    let assert Ok(_db_process) = pog.start(pog_config)

    context.Context(static_directory:, database:)
  })
}

/// Create a persistent `Context` value, available to all processes.
/// SQL queries will be rolled back at the end of the function scope.
///
/// ## Examples
///
/// ```gleam
/// pub fn wibble_test() -> Nil {
///   use context <- server_test.with_context()
///
///   // resources will be cleaned up
///   case user.register(context.database, todo) {
///     Ok(_data) -> todo as "handle data"
///     Error(_error) -> todo as "handle error"
///   }
/// }
/// ```
pub fn with_context(next: fn(context.Context) -> a) -> Nil {
  let context = global_context()
  let transaction = fn(database) {
    next(context.Context(..context, database:))
    Error(Nil)
  }

  let assert Error(pog.TransactionRolledBack(Nil)) =
    pog.transaction(context.database, transaction)

  Nil
}

import pog

pub type Context {
  Context(
    /// PostgreSQL connection pool
    database: pog.Connection,
    /// Path to the application's priv directory
    static_directory: String,
  )
}

import gleam/dynamic/decode
import gleam/json
import gleam/time/calendar
import gleam/time/timestamp
import gleam/uri
import youid/uuid

/// Encode a `uuid.Uuid` into a json string.
pub fn uuid_to_json(id: uuid.Uuid) -> json.Json {
  uuid.to_string(id)
  |> json.string
}

/// A decoder that decodes `uuid.Uuid` values.
pub fn uuid_decoder() {
  use text <- decode.then(decode.string)
  case uuid.from_string(text) {
    Ok(id) -> decode.success(id)
    Error(_) -> decode.failure(uuid.v7(), "uuid")
  }
}

/// Encode a `timestamp.Timestamp` into a rfc3339 JSON string.
pub fn timestamp_to_json(timestamp: timestamp.Timestamp) -> json.Json {
  timestamp.to_rfc3339(timestamp, calendar.utc_offset)
  |> json.string()
}

/// A decoder that decodes `timestamp.Timestamp` rfc3339 values.
pub fn timestamp_decoder() -> decode.Decoder(timestamp.Timestamp) {
  use string <- decode.then(decode.string)
  case timestamp.parse_rfc3339(string) {
    Ok(data) -> decode.success(data)
    Error(_) -> decode.failure(timestamp.system_time(), "rfc3339")
  }
}

/// A decoder that decodes `uri.Uri` values.
pub fn uri_decoder() -> decode.Decoder(uri.Uri) {
  use string <- decode.then(decode.string)
  case uri.parse(string) {
    Ok(data) -> decode.success(data)
    Error(_) -> decode.failure(uri.empty, "uri")
  }
}

/// A decoder that decodes `uri.Uri` values.
pub fn uri_to_json(uri: uri.Uri) -> json.Json {
  uri.to_string(uri)
  |> json.string
}

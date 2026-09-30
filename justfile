mod backend "./backend/justfile"
mod frontend "./frontend/justfile"

set quiet

[private]
default:
    just --list

# Run all containers
[group("dev")]
up:
    just backend::up

# Stop all containers
[group("dev")]
down:
    just backend::down

# Build frontend and backend applications
[group("dev")]
build:
    just backend::build

# Run application
[group("dev")]
run:
    just backend::run

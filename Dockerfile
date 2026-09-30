ARG ERLANG_VERSION=29
ARG GLEAM_VERSION=v1.18.1

FROM ghcr.io/gleam-lang/gleam:${GLEAM_VERSION}-scratch as gleam

FROM docker.io/erlang:${ERLANG_VERSION}-alpine AS builder
COPY --from=gleam /bin/gleam /bin/gleam
COPY ./backend/ /app/

WORKDIR /app
RUN apk add --no-cache build-base
RUN gleam export erlang-shipment

FROM ghcr.io/gleam-lang/gleam:${GLEAM_VERSION}-erlang-alpine as runner
RUN apk add --no-cache wget
COPY --from=builder /app/build/erlang-shipment /app

EXPOSE 8000
WORKDIR /app
ENTRYPOINT ["sh", "./entrypoint.sh"]
CMD ["run"]

ARG ERLANG_VERSION=29
ARG GLEAM_VERSION=v1.19.0
ARG NODE_VERSION=26

# frontend step
FROM docker.io/node:${NODE_VERSION}-alpine AS frontend
WORKDIR /app
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci
COPY ./frontend/ ./
RUN npm run build --no-fund \
    && mv dist/assets/*.css dist/assets/client.css \
    && mv dist/assets/*.js dist/assets/client.js

# backend step
FROM ghcr.io/gleam-lang/gleam:${GLEAM_VERSION}-scratch as gleam
FROM docker.io/erlang:${ERLANG_VERSION}-alpine AS builder
COPY --from=gleam /bin/gleam /bin/gleam
COPY ./backend/ /app/
COPY --from=frontend /app/dist /app/priv/static

WORKDIR /app
RUN apk add --no-cache build-base
RUN gleam export erlang-shipment

# runner step
FROM ghcr.io/gleam-lang/gleam:${GLEAM_VERSION}-erlang-alpine as runner
RUN apk add --no-cache wget
COPY --from=builder /app/build/erlang-shipment /app

EXPOSE 8000
WORKDIR /app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["run"]

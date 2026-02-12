FROM node:lts-slim as frontend

RUN corepack enable

WORKDIR /frontend

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install

COPY frontend ./
RUN pnpm run build

FROM rust:latest as backend

RUN rustup target add x86_64-unknown-linux-musl

WORKDIR /filesoup

RUN mkdir frontend

COPY --from=frontend /frontend/dist ./frontend/dist

COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl

FROM scratch

COPY --from=backend /filesoup/target/x86_64-unknown-linux-musl/release/filesoup /filesoup

ENV ROCKET_ADDRESS 0.0.0.0
ENV ROCKET_PORT 8080
ENV HSTS_ENABLED true

EXPOSE ${ROCKET_PORT}

USER 1000

CMD [ "/filesoup" ]

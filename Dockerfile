# DDACOIN node: btcd fork with time-based consensus.
# P2P port 9666, RPC port 9667.
#
# Build: docker build . -t ddacoin
# Run:   docker run -v ddacoin-data:/data -p 9666:9666 -p 9667:9667 ddacoin
# Optional block producer: add --generate --miningaddr=<address>

ARG ARCH=amd64
FROM golang@sha256:4bb4be21ac98da06bc26437ee870c4973f8039f13e9a1a36971b4517632b0fc6 AS build-container

ARG ARCH

ADD . /app
WORKDIR /app
RUN set -ex \
  && if [ "${ARCH}" = "amd64" ]; then export GOARCH=amd64; fi \
  && if [ "${ARCH}" = "arm32v7" ]; then export GOARCH=arm; fi \
  && if [ "${ARCH}" = "arm64v8" ]; then export GOARCH=arm64; fi \
  && echo "Compiling for $GOARCH" \
  && go build -buildvcs=false -o /bin/ddacoin .

FROM $ARCH/alpine:3.21

COPY --from=build-container /bin/ddacoin /bin/ddacoin

# Persist chain and config
VOLUME ["/data"]

# P2P (9666), RPC (9667)
EXPOSE 9666 9667

ENTRYPOINT ["ddacoin"]
CMD ["-b", "/data"]
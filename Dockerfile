# DDACOIN node: btcd fork with time-based consensus.
# P2P port 9666, RPC port 9667.
#
# Build: docker build . -t ddacoin
# Run:   docker run -v ddacoin-data:/data -p 9666:9666 -p 9667:9667 ddacoin
# Optional block producer: add --generate --miningaddr=<address>

ARG ARCH=amd64
ARG TARGETOS
ARG TARGETARCH
ARG TARGETPLATFORM
ARG BUILDPLATFORM
FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS build-container

ARG ARCH

ADD . /app
WORKDIR /app
RUN set -ex \
  && if [ -n "${ARCH}" ]; then \
       if [ "${ARCH}" = "amd64" ]; then export GOARCH=amd64; fi; \
       if [ "${ARCH}" = "arm32v7" ]; then export GOARCH=arm; export GOARM=7; fi; \
       if [ "${ARCH}" = "arm64v8" ]; then export GOARCH=arm64; fi; \
     else \
       if [ "${TARGETARCH}" = "amd64" ]; then export GOARCH=amd64; fi; \
       if [ "${TARGETARCH}" = "arm" ]; then export GOARCH=arm; export GOARM=7; fi; \
       if [ "${TARGETARCH}" = "arm64" ]; then export GOARCH=arm64; fi; \
     fi \
  && echo "Compiling for $GOARCH" \
  && GOOS=${TARGETOS:-linux} go build -buildvcs=false -o /bin/ddacoin .

FROM --platform=$TARGETPLATFORM alpine:3.21

COPY --from=build-container /bin/ddacoin /bin/ddacoin

# Persist chain and config
VOLUME ["/data"]

# P2P (9666), RPC (9667)
EXPOSE 9666 9667

ENTRYPOINT ["ddacoin"]
CMD ["-b", "/data"]
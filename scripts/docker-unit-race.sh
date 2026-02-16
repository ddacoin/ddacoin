#!/usr/bin/env bash
# Run make build and make unit-race inside a Go container with the repo mounted.
# Use this when the host lacks Go or to match CI (e.g. workspace and module resolution).
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker run --rm \
  -v "$REPO_ROOT:/app" \
  -w /app \
  -e GOWORK=/app/go.work \
  -e GOFLAGS=-buildvcs=false \
  golang:1.23 \
  bash -c 'git config --global --add safe.directory /app 2>/dev/null || true; make build && make unit-race'

#!/usr/bin/env bash
set -euo pipefail

CERTS_DIR="./certs"
mkdir -p "$CERTS_DIR"

# Generate self-signed certificate for HTTPS
openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Generated SSL certificates in $CERTS_DIR:"
echo "  - cert.pem: Self-signed certificate"
echo "  - key.pem: Private key"
echo
echo "Use 'npm run start:remote' to start the server with HTTPS"
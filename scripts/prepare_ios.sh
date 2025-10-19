#!/usr/bin/env bash
# Simple helper to prepare iOS native project (best run on macOS)
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Warning: iOS build requires macOS + Xcode. This script prepares config files but cannot build an .ipa on Linux."
  echo "Options:"
  echo "  - Run this repository on a Mac and execute: npm ci && npm run ios:init && npm run build && npm run ios:add && npm run ios:open"
  echo "  - Or configure GitHub Actions macOS runner with secrets (see .github/workflows/build-ios.yml) to produce an .ipa automatically."
  exit 0
fi

echo "Detected macOS. Installing node modules and initializing Capacitor..."
npm ci || npm install
npm run ios:init
npm run build
npm run ios:add
npm run ios:sync
echo "Now run: npm run ios:open to open the iOS project in Xcode and archive/export there."

#!/bin/bash
set -e

ROOT="/Users/blacknova/Documents/Shirt Tracker/shirt-tracker"

cd "$ROOT"
npm run sync:tauri

cd "$ROOT/apps/desktop-tauri"
CARGO_TARGET_DIR="$ROOT/apps/desktop-tauri/src-tauri/target" npx tauri build

open "$ROOT/apps/desktop-tauri/src-tauri/target/release/bundle/macos/Shirt Tracker.app"

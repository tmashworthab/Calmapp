#!/bin/bash
# Builds "Printer Wi-Fi Switcher.app" into ./build. Needs Xcode or the Xcode
# Command Line Tools (run `xcode-select --install` once if `swift` is missing).
set -euo pipefail
cd "$(dirname "$0")"

swift build -c release

APP="build/Printer Wi-Fi Switcher.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
cp .build/release/PrinterWiFiSwitcher "$APP/Contents/MacOS/"
cp Resources/Info.plist "$APP/Contents/"
codesign --force --sign - "$APP"

echo "Built: $APP"
echo "Open it with:  open \"$APP\""

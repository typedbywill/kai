#!/usr/bin/env bash
set -e

echo "==============================================="
echo "     KAI (Desktop AI Helper) Tauri Installer"
echo "==============================================="

# Detect distro
if [ -f /etc/fedora-release ]; then
  DISTRO="fedora"
elif [ -f /etc/debian_version ] || [ -f /etc/lsb-release ]; then
  DISTRO="ubuntu"
elif [ -f /etc/arch-release ]; then
  DISTRO="arch"
else
  DISTRO="unknown"
fi

echo "[INFO] Detected distribution type: $DISTRO"

# Install npm packages
echo "[INFO] Installing npm packages..."
npm install

# Build Tauri app
echo "[INFO] Building KAI Tauri v2 binary..."
npx tauri build

# Install binary to user local bin (~/.local/bin) or system (/usr/local/bin)
BINARY_SRC="src-tauri/target/release/kai-overlay"
if [ ! -f "$BINARY_SRC" ]; then
  BINARY_SRC="src-tauri/target/release/kai"
fi

if [ -f "$BINARY_SRC" ]; then
  TARGET_DIR="$HOME/.local/bin"
  mkdir -p "$TARGET_DIR"
  cp "$BINARY_SRC" "$TARGET_DIR/kai"
  chmod +x "$TARGET_DIR/kai"
  echo "[SUCCESS] KAI binary installed at $TARGET_DIR/kai"
else
  echo "[ERROR] Binary build artifact not found at $BINARY_SRC"
  exit 1
fi

echo "==============================================="
echo "  KAI Installation Completed Successfully! 🎉"
echo "  Run 'kai' to launch the desktop overlay."
echo "  Hotkey: Meta + X (or Super + X)"
echo "==============================================="

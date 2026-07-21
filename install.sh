#!/usr/bin/env bash
set -e

echo "==============================================="
echo "     KAI (Desktop AI Helper) Tauri Installer"
echo "==============================================="

# Kill running kai processes (exact match to avoid killing rustc)
echo "[INFO] Stopping any running KAI instances..."
pkill -x kai 2>/dev/null || true
pkill -f "target/release/kai-overlay" 2>/dev/null || true
pkill -f "target/debug/kai-overlay" 2>/dev/null || true

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

# Install binary to user local bin (~/.local/bin) and /usr/local/bin
BINARY_SRC="src-tauri/target/release/kai-overlay"
if [ ! -f "$BINARY_SRC" ]; then
  BINARY_SRC="src-tauri/target/release/kai"
fi

if [ -f "$BINARY_SRC" ]; then
  # Install to user local bin
  TARGET_DIR="$HOME/.local/bin"
  mkdir -p "$TARGET_DIR"
  cp "$BINARY_SRC" "$TARGET_DIR/kai"
  chmod +x "$TARGET_DIR/kai"
  echo "[SUCCESS] KAI binary installed at $TARGET_DIR/kai"

  # Install to /usr/local/bin if possible
  if [ -w "/usr/local/bin" ]; then
    cp "$BINARY_SRC" "/usr/local/bin/kai"
    chmod +x "/usr/local/bin/kai"
    echo "[SUCCESS] KAI binary updated at /usr/local/bin/kai"
  elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo cp "$BINARY_SRC" "/usr/local/bin/kai"
    sudo chmod +x "/usr/local/bin/kai"
    echo "[SUCCESS] KAI binary updated at /usr/local/bin/kai (via sudo)"
  fi
else
  echo "[ERROR] Binary build artifact not found at $BINARY_SRC"
  exit 1
fi

# Install desktop entry and configure global shortcut (Super+X / Meta+X -> kai --toggle)
echo "[INFO] Configuring desktop shortcut (Super+X / Meta+X -> kai --toggle)..."
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"
cat << 'EOF' > "$DESKTOP_DIR/kai-toggle.desktop"
[Desktop Entry]
Name=KAI Toggle
Comment=Toggle KAI Desktop AI Helper
Exec=kai --toggle
Terminal=false
Type=Application
Categories=Utility;
X-KDE-GlobalAccel-Shortcut=Meta+X
EOF

# KDE Plasma Shortcut Configuration
if command -v kwriteconfig6 >/dev/null 2>&1; then
  KCONFIG="kwriteconfig6"
elif command -v kwriteconfig5 >/dev/null 2>&1; then
  KCONFIG="kwriteconfig5"
else
  KCONFIG=""
fi

if [ -n "$KCONFIG" ]; then
  $KCONFIG --file "$HOME/.config/kglobalshortcutsrc" --group "kai-toggle.desktop" --key "_launch" "Meta+X,Meta+X,KAI Toggle"
  $KCONFIG --file "$HOME/.config/kglobalshortcutsrc" --group "services" --key "kai-toggle.desktop" "Meta+X,Meta+X,KAI Toggle"
  dbus-send --session --type=method_call --dest=org.kde.kglobalaccel /kglobalaccel org.kde.KGlobalAccel.reloadConfig 2>/dev/null || true
  echo "[SUCCESS] KDE Global Shortcut configured: Meta+X -> kai --toggle"
fi

# GNOME Shortcut Configuration
if command -v gsettings >/dev/null 2>&1 && [ "$XDG_CURRENT_DESKTOP" = "GNOME" -o "$XDG_CURRENT_DESKTOP" = "Ubuntu" -o "$XDG_CURRENT_DESKTOP" = "Pop:GNOME" ]; then
  KEY_PATH="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/kai-toggle/"
  gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['$KEY_PATH']" 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH name 'KAI Toggle' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH command 'kai --toggle' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH binding '<Super>x' 2>/dev/null || true
fi

# XFCE Shortcut Configuration
if command -v xfconf-query >/dev/null 2>&1; then
  xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/<Super>x" -n -t string -s "kai --toggle" 2>/dev/null || true
fi

echo "==============================================="
echo "  KAI Installation Completed Successfully! 🎉"
echo "  Run 'kai' to launch the desktop overlay."
echo "  Run 'kai --toggle' to toggle overlay visibility."
echo "  Hotkey: Meta + X (or Super + X)"
echo "==============================================="

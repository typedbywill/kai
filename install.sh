#!/usr/bin/env bash
set -e

echo "==============================================="
echo "     KAI v2 (Desktop AI Helper) Installer"
echo "==============================================="

# ── Stop existing KAI ──
echo "[INFO] Stopping any running KAI instances..."
systemctl --user stop kai.service 2>/dev/null || true
pkill -x kai 2>/dev/null || true
pkill -f "target/release/kai-overlay" 2>/dev/null || true
pkill -f "target/debug/kai-overlay" 2>/dev/null || true
sleep 1

# ── Detect distro ──
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

# ── Install npm packages ──
echo "[INFO] Installing npm packages..."
npm install

# ── Build Tauri app ──
echo "[INFO] Building KAI Tauri v2 binary..."
npx tauri build

# ── Install binary ──
BINARY_SRC="src-tauri/target/release/kai-overlay"
if [ ! -f "$BINARY_SRC" ]; then
  BINARY_SRC="src-tauri/target/release/kai"
fi

if [ -f "$BINARY_SRC" ]; then
  # Install to user local bin
  TARGET_DIR="$HOME/.local/bin"
  mkdir -p "$TARGET_DIR"
  rm -f "$TARGET_DIR/kai"
  cp "$BINARY_SRC" "$TARGET_DIR/kai"
  chmod +x "$TARGET_DIR/kai"
  echo "[SUCCESS] KAI binary installed at $TARGET_DIR/kai"

  # Install to /usr/local/bin if possible
  if [ -w "/usr/local/bin" ]; then
    rm -f "/usr/local/bin/kai"
    cp "$BINARY_SRC" "/usr/local/bin/kai"
    chmod +x "/usr/local/bin/kai"
    echo "[SUCCESS] KAI binary updated at /usr/local/bin/kai"
  elif command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo rm -f "/usr/local/bin/kai"
    sudo cp "$BINARY_SRC" "/usr/local/bin/kai"
    sudo chmod +x "/usr/local/bin/kai"
    echo "[SUCCESS] KAI binary updated at /usr/local/bin/kai (via sudo)"
  fi
else
  echo "[ERROR] Binary build artifact not found at $BINARY_SRC"
  exit 1
fi

# ── Install systemd user service ──
echo "[INFO] Installing systemd user service..."
SYSTEMD_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"
cp "resources/kai.service" "$SYSTEMD_DIR/kai.service"
systemctl --user daemon-reload
systemctl --user enable kai.service
echo "[SUCCESS] Systemd user service installed and enabled"

# ── Install desktop entry ──
echo "[INFO] Configuring desktop shortcut (Super+X -> kai --toggle)..."
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

# ── Configure DE-specific shortcuts ──

# KDE Plasma
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

# GNOME
if command -v gsettings >/dev/null 2>&1 && [ "$XDG_CURRENT_DESKTOP" = "GNOME" -o "$XDG_CURRENT_DESKTOP" = "Ubuntu" -o "$XDG_CURRENT_DESKTOP" = "Pop:GNOME" ]; then
  KEY_PATH="/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/kai-toggle/"
  gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['$KEY_PATH']" 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH name 'KAI Toggle' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH command 'kai --toggle' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:$KEY_PATH binding '<Super>x' 2>/dev/null || true
fi

# XFCE
if command -v xfconf-query >/dev/null 2>&1; then
  xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/<Super>x" -n -t string -s "kai --toggle" 2>/dev/null || true
fi

# ── Start service ──
echo "[INFO] Starting KAI service..."
systemctl --user start kai.service
echo "[SUCCESS] KAI service started"

echo "==============================================="
echo "  KAI v2 Installation Completed! 🎉"
echo "  KAI is running as a background service."
echo "  Hotkey: Meta + X (toggle overlay)"
echo "  Hotkey: Meta + Shift + X (capture text)"
echo "  Hotkey: Meta + Shift + S (capture screen)"
echo "  Run 'systemctl --user status kai' to check status."
echo "==============================================="

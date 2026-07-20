#!/usr/bin/env bash
#
# KAI (Desktop AI Helper Overlay) Automated Installer
# Technology Stack: Tauri v2 + HTML/CSS/JS
# Supported distros: Arch Linux, Fedora, Ubuntu (24.04+) / Debian
#

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}     KAI (Desktop AI Helper) Tauri Installer   ${NC}"
echo -e "${BLUE}===============================================${NC}"

# 1. Detect OS
OS_TYPE=""
if [ -f /etc/arch-release ]; then
    OS_TYPE="arch"
elif [ -f /etc/debian_version ]; then
    OS_TYPE="debian"
elif [ -f /etc/fedora-release ]; then
    OS_TYPE="fedora"
else
    if [ -f /etc/os-release ]; then
        if grep -qi "ubuntu" /etc/os-release; then
            OS_TYPE="debian"
        elif grep -qi "arch" /etc/os-release; then
            OS_TYPE="arch"
        elif grep -qi "fedora" /etc/os-release; then
            OS_TYPE="fedora"
        elif grep -qi "debian" /etc/os-release; then
            OS_TYPE="debian"
        fi
    fi
fi

if [ -z "$OS_TYPE" ]; then
    log_error "Unsupported distribution."
    exit 1
fi

log_info "Detected distribution type: ${OS_TYPE}"

# 2. Install dependencies
log_info "Installing Tauri v2 build dependencies (requires sudo)..."

case "$OS_TYPE" in
    "arch")
        sudo pacman -S --needed --noconfirm base-devel curl wget openssl gtk3 libayatana-appindicator librsvg webkit2gtk-4.1 nodejs npm rust
        ;;
    "debian")
        sudo apt-get update
        sudo apt-get install -y build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libwebkit2gtk-4.1-dev nodejs npm rustc cargo
        ;;
    "fedora")
        sudo dnf install -y gcc-c++ openssl-devel gtk3-devel webkit2gtk4.1-devel libsoup3-devel libappindicator-gtk3-devel librsvg2-devel nodejs npm rust cargo
        ;;
esac

log_success "Dependencies installed successfully."

# 3. Build KAI
log_info "Installing npm packages..."
npm install

log_info "Building KAI Tauri v2 binary..."
npm run tauri build

log_success "Build completed! Binary located in src-tauri/target/release/kai"

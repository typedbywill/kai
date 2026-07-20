#!/usr/bin/env bash
#
# KAI (KDE AI Overlay) Automated Installer
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
echo -e "${BLUE}         KAI (KDE AI Overlay) Installer        ${NC}"
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
    # Fallback to checking os-release
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
    echo "Please manually install the dependencies and build KAI:"
    echo "  - CMake (>= 3.16)"
    echo "  - C++ compiler with C++20 support (gcc/g++)"
    echo "  - Qt 6 (Core, Gui, Qml, Quick, Network)"
    echo "  - KF6 (Kirigami, GlobalAccel)"
    echo "  - Extra CMake Modules (ECM)"
    exit 1
fi

log_info "Detected distribution type: ${OS_TYPE}"

# Helper to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 2. Install dependencies
log_info "Installing development dependencies (this may request sudo privileges)..."

case "$OS_TYPE" in
    "arch")
        # Arch packages are usually rolling and up-to-date
        sudo pacman -S --needed --noconfirm git cmake base-devel extra-cmake-modules qt6-base qt6-declarative kirigami kglobalaccel
        ;;
    "debian")
        sudo apt-get update
        sudo apt-get install -y git cmake build-essential extra-cmake-modules qt6-base-dev qt6-declarative-dev libkf6kirigami-dev libkf6globalaccel-dev
        ;;
    "fedora")
        sudo dnf install -y git cmake gcc-c++ extra-cmake-modules qt6-qtbase-devel qt6-qtdeclarative-devel kf6-kirigami-devel kf6-kglobalaccel-devel
        ;;
esac

log_success "Dependencies installed successfully."

# 3. Setup repository path
TEMP_DIR=""
if [ -f "CMakeLists.txt" ] && [ -d "src" ]; then
    log_info "Running from local repository root."
else
    log_info "Cloning repository..."
    TEMP_DIR=$(mktemp -d -t kai-build-XXXXXX)
    git clone https://github.com/typedbywill/kai.git "$TEMP_DIR"
    cd "$TEMP_DIR"
fi

# 4. Build the application
log_info "Configuring project with CMake..."
cmake -B build -DCMAKE_BUILD_TYPE=Release

log_info "Compiling project..."
cmake --build build -j"$(nproc)"

# 5. Install the application
log_info "Installing to /usr/local (requires sudo privileges)..."
sudo cmake --install build

# 6. Cleanup temporary directory if created
if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    log_info "Cleaning up temporary build folder..."
    rm -rf "$TEMP_DIR"
fi

log_success "KAI (KDE AI Overlay) installed successfully!"
echo -e "You can start the overlay by typing: ${GREEN}kai${NC}"
echo -e "Use the global shortcut ${GREEN}Meta + X${NC} to toggle the interface anywhere."
echo -e "Configure your API key in the settings panel of the application."

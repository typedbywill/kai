# KAI: KDE AI Overlay

[![Build CI](https://github.com/typedbywill/kai/actions/workflows/build.yml/badge.svg)](https://github.com/typedbywill/kai/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**KAI** (KDE AI Overlay) is an ultra-lightweight, hotkey-driven desktop AI helper overlay designed for KDE Plasma 6. Written in native C++ using Qt 6 and Kirigami, it provides a seamless, instantaneous AI assistant experience without clunky browser tabs or heavy electron wrappers.

Toggle it instantly anywhere with **`Meta + X`**.

---

## Key Features

- **Lightning-Fast Overlay:** Launches immediately, overlays on top of your work, and hides instantly when it loses focus or when you press `Escape`.
- **Global Toggle Shortcut (`Meta + X`):** Fully integrated via `KGlobalAccel`. Register once, toggle from anywhere.
- **OpenAI-Compatible Streaming:** Supports real-time word-by-word streaming responses from OpenAI or any compatible backend (e.g., local models via Ollama, LM Studio, or OpenRouter).
- **Markdown & Code Rendering:** Beautiful, native rendering of Markdown responses, including lists, links, and code blocks.
- **Native Look & Feel:** Leverages KDE's Kirigami framework to perfectly match your system's light/dark colors, borders, and typography.
- **Persistent Local Settings:** Safely stores your API keys and custom server configurations locally.

---

## Quick Installation (Automated)

You can install KAI and its dependencies automatically with a single copy-paste command. Run the following in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/typedbywill/kai/main/install.sh | bash
```

> [!NOTE]
> The script will auto-detect your distribution (Arch, Fedora, or Ubuntu 24.04+ / Debian), install the required build dependencies, compile KAI, and install it to `/usr/local/bin`. It will prompt for `sudo` privileges to install system packages and install the binary.

---

## Manual Installation

If you prefer to install dependencies and build KAI manually, follow the instructions for your distribution below.

### 1. Install Build Dependencies

Ensure you have a C++ compiler supporting C++20, CMake, and the appropriate Qt6/KF6 development packages:

#### Arch Linux
```bash
sudo pacman -S --needed git cmake base-devel extra-cmake-modules qt6-base qt6-declarative kirigami kglobalaccel
```

#### Fedora
```bash
sudo dnf install -y git cmake gcc-c++ extra-cmake-modules qt6-qtbase-devel qt6-qtdeclarative-devel kf6-kirigami-devel kf6-kglobalaccel-devel
```

#### Ubuntu 24.04+ (Noble Numbat) / Debian (Trixie+)
```bash
sudo apt update
sudo apt install -y git cmake build-essential extra-cmake-modules qt6-base-dev qt6-declarative-dev libkf6kirigami-dev libkf6globalaccel-dev
```

### 2. Build & Install

Run these commands in your terminal to build and install KAI:

```bash
# Clone the repository
git clone https://github.com/typedbywill/kai.git
cd kai

# Configure the build directory
cmake -B build -DCMAKE_BUILD_TYPE=Release

# Compile the application
cmake --build build -j$(nproc)

# Install the application (installs to /usr/local/bin)
sudo cmake --install build
```

---

## Getting Started

1. **Launch KAI:**
   Run `kai` from your runner (`KRunner`, terminal, or app launcher).
2. **Toggle the Overlay:**
   Press `Meta + X` on your keyboard to show/hide the window.
3. **Configure API:**
   - Click the **Settings** button in the overlay (or press the corresponding icon).
   - Enter your **API Key**.
   - (Optional) Customize the **Base URL** (e.g. `http://localhost:11434/v1` for local Ollama setup) and **Model Name** (e.g., `gpt-4o`, `llama3`).
   - Click **Save** and start chatting!

---

## Development

To make changes to the source code:

- Core controller logic resides in [src/KAIController.cpp](file:///home/william/Documentos/projetos/pessoal/ai-helper/src/KAIController.cpp) and [src/KAIController.h](file:///home/william/Documentos/projetos/pessoal/ai-helper/src/KAIController.h).
- The user interface is built using QML in [src/ui/Overlay.qml](file:///home/william/Documentos/projetos/pessoal/ai-helper/src/ui/Overlay.qml) and [src/ui/SettingsView.qml](file:///home/william/Documentos/projetos/pessoal/ai-helper/src/ui/SettingsView.qml).

Feel free to open Pull Requests or Issues!

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

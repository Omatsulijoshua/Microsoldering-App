# Microsolder AI Setup & Tool Integration Guide

This guide details how to install the backend API server, client dashboard, and configure native USB drivers for Apple and Android diagnosis on your repair workstation.

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher.
- **Git** (optional).
- **USB Data Cables**: High-quality OEM cables (USB-C/Lightning).

---

## 2. USB Tooling Setup

To perform active hardware scanning, the Microsolder AI server calls native command-line interface utilities. You must install these utilities on your host system:

### A. Android Support (ADB / Fastboot)
1. **Windows**:
   - Download the official [Android SDK Platform Tools for Windows](https://developer.android.com/tools/releases/platform-tools).
   - Extract the folder (e.g., to `C:\platform-tools`).
   - Add `C:\platform-tools` to your system's `PATH` Environment Variable.
   - Run `adb --version` in terminal to confirm.
2. **macOS**:
   - Install via Homebrew: `brew install android-platform-tools`
3. **Android Device Config**:
   - Go to **Settings > About Phone > Tap 'Build Number' 7 times** to unlock Developer Options.
   - Go to **Developer Options > Enable USB Debugging**.
   - Upon first connecting to the PC, accept the security dialog "Allow USB Debugging from this computer".

### B. Apple iOS Support (libimobiledevice)
1. **macOS**:
   - Install via Homebrew: `brew install libimobiledevice`
2. **Windows**:
   - Install Apple Mobile Device Support (usually bundled with iTunes). Ensure your computer detects the iPhone in File Explorer.
   - Download compiled libimobiledevice binaries for Windows (available on GitHub under Quamotion/libimobiledevice or similar mirrors).
   - Extract and add the binary folder to your system's `PATH` Environment Variable.
   - Run `ideviceinfo` in command prompt to verify connection.

---

## 3. Project Installation

### A. Backend Express Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
The backend server runs on `http://localhost:5000`.

### B. Client Desktop Dashboard
1. Navigate to the desktop app directory:
   ```bash
   cd ../desktop_app
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the Vite client:
   ```bash
   npm run dev
   ```
The dashboard will open on `http://localhost:3000`.

---

## 4. Troubleshooting Connection Faults

### "Unauthorized Device" Status (Android)
- **Problem**: ADB detects the device, but returns `unauthorized` status.
- **Fix**: Check the device screen. A popup dialog will ask you to approve the computer's RSA key fingerprint. Check "Always allow" and tap **OK**.

### "Device Not Found" (iPhone)
- **Problem**: `ideviceinfo` fails to read device parameters.
- **Fix**: 
  - Ensure the iPhone screen is unlocked.
  - Connect the phone, tap **Trust This Computer** on the device, and input the passcode.
  - Verify USB cable is not charging-only.

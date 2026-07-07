# Microsolder AI - Enterprise Electronics Diagnostics Platform

Microsolder AI is a professional diagnostic and lab management monorepo designed for electronics repair shops, micro-soldering labs, and IC design engineers. It provides automated panic log analysis, Android debugging logs extraction, live multimeter measurement records, and visual classifier overlays.

---

## 🏗️ System Architecture

The following diagram illustrates the interaction between the multi-platform clients, the NestJS API server gateway, database schemas, and AI endpoints:

```mermaid
graph TD
    %% Clients
    A[Electron Desktop App] -->|HTTPS / IPC| D[NestJS API Gateway]
    B[Flutter Mobile App] -->|HTTPS| D
    C[React Website / Portal] -->|HTTPS| D
    
    %% Core Services
    subgraph backend [NestJS Gateway Server]
        D --> E[Auth Module - JWT]
        D --> F[AI Diagnostics Service]
        D --> G[USB Scanner Helper]
        D --> H[Case Management API]
    end

    %% Heuristics vs AI
    F -->|If Key Unset| I[Local Regex Parser Engine]
    F -->|If Key Set| J[OpenAI API / Claude]
    
    %% Native Triggers (Desktop Only)
    A -->|exec CLI| K[adb / fastboot / ideviceinfo]
    
    %% Database and Cache
    H -->|Prisma Client| L[(PostgreSQL Database)]
    E -->|User Cache| M[(In-Memory Mock DB Fallback)]
```

---

## 📂 Folder Layout

```
microsolder-ai/
├── backend/            # NestJS API, JWT Auth guards, AI Prompters, USB CLI wrappers
├── database/           # Prisma relational schemas, database seeding scripts
├── admin_dashboard/    # React/Tailwind Admin Control panel
├── desktop_app/        # Electron + React dashboard with native IPC port triggers
├── mobile_app/         # Flutter Mobile UI diagnostics template
├── website/            # Landing page featuring subscription pricing cards
├── docs/               # Workspace driver manuals and reference checklists
└── README.md           # Master documentation manual
```

---

## 🔑 Default Credentials & Access Control

The database seed script configures three default access roles (with standard security rules):

*   **Super Administrator**: `superadmin@microsolder.ai`
*   **Content Administrator**: `admin@microsolder.ai`
*   **Workbench Technician**: `tech@microsolder.ai`
*   **Default Development Password**: `Password123!`

---

## 🚦 Installation & Local Development Setup

### Prerequisite Checklist
- **Node.js**: v18.0.0 or higher.
- **Git** (optional).
- **Flutter SDK**: v3.0.0+ (only required for compilation of the mobile app).
- **Workstation CLI tools** (optional, for physical USB scan calls):
  - **Android Platform Tools** (`adb`, `fastboot`) added to system environment variables.
  - **libimobiledevice** (`ideviceinfo`) added to system environment variables.

---

### Step-by-Step Launch Sequence

#### 1. Setup the Database Layer
1. Navigate to the `database` folder:
   ```bash
   cd database
   ```
2. Configure your environment file. In production, create a `.env` file referencing your PostgreSQL server:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/microsolder?schema=public"
   ```
3. Initialize the database schema and run the seed script:
   ```bash
   npx prisma db push
   # Seed the database
   node seed.js
   ```

#### 2. Launch the NestJS Backend API
1. Navigate to the `backend` folder:
   ```bash
   cd ../backend
   ```
2. Configure your backend `.env` variables:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/microsolder?schema=public"
   OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"
   AI_MODEL_NAME="gpt-4o-mini"
   ```
3. Install packages and start the NestJS API:
   ```bash
   npm install
   npm run start:dev
   ```
   *The server runs on http://localhost:5000.*

#### 3. Launch the Admin Control Panel
1. Navigate to `admin_dashboard`:
   ```bash
   cd ../admin_dashboard
   ```
2. Install packages and launch the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
   *Portal runs on http://localhost:3001.*

#### 4. Launch the Electron Desktop Application
1. Navigate to `desktop_app`:
   ```bash
   cd ../desktop_app
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run the development environment:
   - In terminal 1, start the React bundler:
     ```bash
     npm run dev
     ```
   - In terminal 2, launch the Electron container:
     ```bash
     npm run electron:start
     ```
   *Desktop interface is bound to http://localhost:3000.*

#### 5. Launch the Website Landing Page
1. Navigate to `website`:
   ```bash
   cd ../website
   ```
2. Start the webpage:
   ```bash
   npm install
   npm run dev
   ```
   *Webpage runs on http://localhost:3002.*

---

## 🔌 USB Diagnostic Scanners Integration

The Electron desktop app communicates natively with connected USB devices. To configure device detection on Windows:

### Windows USB Drivers Binding:
1. **Android**: Install the Google USB Driver from Android Studio's SDK manager. Enable USB Debugging in target device Developer options.
2. **Apple iOS**: Install Apple Mobile Device Support (bundled with iTunes). Lock/Unlock the screen and select **Trust this computer** when prompt displays.
3. **libimobiledevice on Windows**: Use [Zadig](https://zadig.akeo.ie/) if necessary to bind Windows WinUSB/libusb drivers to connected iPhone USB ports.

---

## 🛠️ AI Prompter Schema & Structured Response contracts

The backend API handles diagnostics queries using structured JSON formats to guarantee frontend UI rendering.

### Symptom Analysis Endpoint
*   **Method**: `POST`
*   **Path**: `/diagnosis/symptom`
*   **Body Schema**:
    ```json
    {
      "symptom": "iPhone 12 restarts every 3 minutes, water indicator is pink",
      "modelName": "iPhone 12"
    }
    ```
*   **Response Contract**:
    ```json
    {
      "summary": "Watchdog panic indicates communication loss...",
      "likelyFaults": [
        {
          "fault": "Barometer Sensor prs0 Corrosion",
          "confidence": 0.95,
          "reason": "Water entry near the lightning port FPC connector is stalling the I2C3 bus.",
          "componentsToCheck": ["FPC J5700", "prs0 barometer module"],
          "railsToMeasure": ["PP_VAR_S2_LDO1", "I2C3_SDA"],
          "recommendedTests": ["Check diode readings on I2C lines"]
        }
      ],
      "stepByStepDiagnosis": [
        "Unplug charging port FPC",
        "Clean corrosion under microscope",
        "Test device boot cycles"
      ],
      "repairDifficulty": "MEDIUM",
      "toolsNeeded": ["Microscope", "Isopropyl Alcohol"],
      "safetyWarnings": ["Disconnect battery before lifting charging connectors"],
      "nextQuestions": ["Does it charge at 5V 1.5A?"]
    }
    ```

---

## ⚖️ Safety & Legality Boundaries

Microsolder AI is designed exclusively for non-invasive hardware fault diagnosis, motherboard voltage comparisons, and repair workflow documentation.

> [!WARNING]
> The app **strictly prohibits** and does not contain methods for:
> - Stolen device unlocking or DRM bypasses.
> - iCloud, Google FRP, or lock-screen passcode bypasses.
> - IMEI alteration or cellular locking modifications.

---

## 📦 Compiling and Packaging Desktop `.exe`

The React client utilizes `electron-builder` parameters configured inside `desktop_app/package.json` to generate an independent installer file:

1. Compile client scripts:
   ```bash
   cd desktop_app
   npm run build
   ```
2. Build the NSIS Windows installer:
   ```bash
   npm run electron:pack
   ```
*The packaged Windows installer `.exe` will be written to `desktop_app/dist-electron/`.*

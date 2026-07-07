import React, { useState, useEffect } from "react";

// Types matching Backend API
interface UsbDeviceDetails {
  connected: boolean;
  brand: string;
  model: string;
  serialNumber: string;
  osVersion: string;
  bootMode: string;
  batteryHealth?: string;
  chargeCycles?: number;
  rawDetails: string;
  warning?: string;
}

interface PanicDiagnosis {
  parsedSensor: string | null;
  suspectedFault: string;
  confidence: number;
  description: string;
  recommendations: string;
  steps: string[];
  relatedRails: string[];
}

interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  status: string;
  brand: string;
  model: string;
  faultDescription: string;
  diagnosedFault: string | null;
  measurements: Record<string, { voltage: number; status: string }>;
  cost: number;
  notes: string;
  createdAt: string;
}

interface KBGuide {
  id: string;
  title: string;
  category: string;
  device: string;
  content: string;
}

// Preset Panic Logs for testing
const PANIC_PRESETS: Record<string, string> = {
  prs0: `{"bug_type":"210","timestamp":"2026-07-06 14:05:00.00 +0100","os_version":"iPhone OS 17.4.1 (21E236)"}
panic(cpu 0 caller 0xfffffff02bb4b2ac): "Missing sensor(s): prs0\\n" @Watchdog.cpp:180
Debugger message: syslog saved
SMC watchdog reset triggered. Barometer sensor disconnected on I2C3 bus.`,
  
  mic2: `panic(cpu 1 caller 0xfffffff0111bc32b): "Missing sensor(s): mic2\\n"
Backtrace:
0xfffffff01334c000 0xfffffff0111bc210
SMC watchdog reset triggered. Power key flex noise microphone unresponsive.`,
  
  ans2: `panic(cpu 0 caller 0xfffffff03bb2a11b): "ans2: NAND Write Error: block 4028, status 0xe00002eb\\n"
SMC Panic Assert: NAND flash failed to respond. Bootloader failed to mount storage system.`,
  
  general: `panic(cpu 0 caller 0xfffffff02bb2cb2a): "SMC Fatal Error: cpu watchdog timeout occurred"
Debugger message: syslog saved. PMU communication stalled.`
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"usb" | "panic" | "boardview" | "microscope" | "tickets" | "tools" | "kb">("usb");
  const [backendUrl] = useState("http://localhost:5000");

  // USB scan state
  const [usbDevice, setUsbDevice] = useState<UsbDeviceDetails>({
    connected: false,
    brand: "No USB Device Detected",
    model: "N/A",
    serialNumber: "N/A",
    osVersion: "N/A",
    bootMode: "Unknown",
    rawDetails: "Click 'Scan USB Port' to locate active devices."
  });
  const [scanning, setScanning] = useState(false);
  const [selectedMockIndex, setSelectedMockIndex] = useState<number>(0);

  // Panic Log state
  const [panicText, setPanicText] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<PanicDiagnosis | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  // Tickets state
  const [ticketsList, setTicketsList] = useState<RepairTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  
  // New Ticket Form state
  const [newCustName, setNewCustName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newFault, setNewFault] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newCost, setNewCost] = useState("150");

  // Boardview state
  const [selectedPcbComponent, setSelectedPcbComponent] = useState<string>("U2");
  const [pcbHighlightShort, setPcbHighlightShort] = useState(false);

  // Microscope analyzer state
  const [microscopePhoto, setMicroscopePhoto] = useState<string>("board_clean");
  const [detectionOverlay, setDetectionOverlay] = useState(false);

  // Calculators state
  const [ohmVolts, setOhmVolts] = useState("3.8");
  const [ohmAmps, setOhmAmps] = useState("0.5");
  const [ohmOhms, setOhmOhms] = useState("7.6");
  const [ohmCalcResult, setOhmCalcResult] = useState<{ watts: string; ohms?: string; amps?: string; volts?: string } | null>(null);

  const [resistorBands, setResistorBands] = useState<string[]>(["brown", "black", "red", "gold"]);
  const [resistorValue, setResistorValue] = useState("1000 Ω (1 kΩ) ±5%");

  // Knowledge base state
  const [kbGuides, setKbGuides] = useState<KBGuide[]>([]);
  const [searchKb, setSearchKb] = useState("");

  // Load Initial Tickets and KB
  useEffect(() => {
    fetchTickets();
    fetchKB();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/tickets`);
      const data = await res.json();
      setTicketsList(data);
      if (data.length > 0) setSelectedTicket(data[0]);
    } catch (e) {
      console.error("Failed to load tickets", e);
    }
  };

  const fetchKB = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/knowledge-base`);
      const data = await res.json();
      setKbGuides(data);
    } catch (e) {
      console.error("Failed to load knowledge base", e);
    }
  };

  // Perform USB Scan
  const scanUsb = async (simulate: boolean = false) => {
    setScanning(true);
    setUsbDevice(prev => ({ ...prev, rawDetails: "Initializing USB scan protocol..." }));
    
    try {
      if (!simulate && (window as any).electronAPI) {
        const nativeDevice = await (window as any).electronAPI.scanUsbDevices();
        setTimeout(() => {
          setUsbDevice(nativeDevice);
          setScanning(false);
        }, 700);
        return;
      }

      let url = `${backendUrl}/api/diagnose/usb`;
      if (simulate) {
        url += `?simulate=true&index=${selectedMockIndex}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      // Delay simulation slightly for professional UX feel
      setTimeout(() => {
        setUsbDevice(data);
        setScanning(false);
      }, 700);
    } catch (e) {
      setScanning(false);
      setUsbDevice({
        connected: false,
        brand: "Error connecting to backend",
        model: "N/A",
        serialNumber: "N/A",
        osVersion: "N/A",
        bootMode: "Unknown",
        rawDetails: "Ensure backend Express server is running on http://localhost:5000"
      });
    }
  };

  // Perform Panic Log Diagnosis
  const diagnosePanic = async (textToDiagnose?: string) => {
    const rawText = textToDiagnose !== undefined ? textToDiagnose : panicText;
    setDiagnosing(true);
    try {
      const res = await fetch(`${backendUrl}/api/diagnose/panic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logContent: rawText })
      });
      const data = await res.json();
      setDiagnosisResult(data);
    } catch (e) {
      console.error("Failed to parse log", e);
    } finally {
      setDiagnosing(false);
    }
  };

  // Preset Panic Selected
  const selectPreset = (key: string) => {
    const log = PANIC_PRESETS[key];
    setPanicText(log);
    diagnosePanic(log);
  };

  // Submit new repair ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newBrand || !newModel || !newFault) return;

    try {
      const res = await fetch(`${backendUrl}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newCustName,
          brand: newBrand,
          model: newModel,
          faultDescription: newFault,
          notes: newNotes,
          cost: parseFloat(newCost),
          status: "OPEN"
        })
      });
      const data = await res.json();
      setTicketsList(prev => [data, ...prev]);
      setSelectedTicket(data);
      
      // Reset form
      setNewCustName("");
      setNewBrand("");
      setNewModel("");
      setNewFault("");
      setNewNotes("");
    } catch (e) {
      console.error("Failed to create ticket", e);
    }
  };

  // Ohm's Law Calculator
  const calculateOhm = (mode: "V" | "I" | "R") => {
    const v = parseFloat(ohmVolts);
    const i = parseFloat(ohmAmps);
    const r = parseFloat(ohmOhms);

    if (mode === "V") {
      // Calculate voltage (V = I * R)
      if (!isNaN(i) && !isNaN(r)) {
        const resultVal = i * r;
        setOhmVolts(resultVal.toFixed(3));
        setOhmCalcResult({
          watts: (resultVal * i).toFixed(3),
          volts: resultVal.toFixed(3)
        });
      }
    } else if (mode === "I") {
      // Calculate current (I = V / R)
      if (!isNaN(v) && !isNaN(r) && r !== 0) {
        const resultVal = v / r;
        setOhmAmps(resultVal.toFixed(3));
        setOhmCalcResult({
          watts: (v * resultVal).toFixed(3),
          amps: resultVal.toFixed(3)
        });
      }
    } else if (mode === "R") {
      // Calculate resistance (R = V / I)
      if (!isNaN(v) && !isNaN(i) && i !== 0) {
        const resultVal = v / i;
        setOhmOhms(resultVal.toFixed(3));
        setOhmCalcResult({
          watts: (v * i).toFixed(3),
          ohms: resultVal.toFixed(3)
        });
      }
    }
  };

  // Resistor band calculator logic
  const handleResistorChange = (bandIndex: number, color: string) => {
    const updated = [...resistorBands];
    updated[bandIndex] = color;
    setResistorBands(updated);

    // Calculate value
    const colors: Record<string, { value: number; multiplier: number; tol: string }> = {
      black: { value: 0, multiplier: 1, tol: "" },
      brown: { value: 1, multiplier: 10, tol: "±1%" },
      red: { value: 2, multiplier: 100, tol: "±2%" },
      orange: { value: 3, multiplier: 1000, tol: "" },
      yellow: { value: 4, multiplier: 10000, tol: "" },
      green: { value: 5, multiplier: 100000, tol: "±0.5%" },
      blue: { value: 6, multiplier: 1000000, tol: "±0.25%" },
      violet: { value: 7, multiplier: 10000000, tol: "±0.1%" },
      grey: { value: 8, multiplier: 100000000, tol: "±0.05%" },
      white: { value: 9, multiplier: 1000000000, tol: "" },
      gold: { value: -1, multiplier: 0.1, tol: "±5%" },
      silver: { value: -1, multiplier: 0.01, tol: "±10%" }
    };

    const first = colors[updated[0]].value;
    const second = colors[updated[1]].value;
    const mult = colors[updated[2]].multiplier;
    const tol = colors[updated[3]]?.tol || "±20%";

    if (first >= 0 && second >= 0) {
      const base = first * 10 + second;
      const finalVal = base * mult;
      let valString = "";
      if (finalVal >= 1000000) {
        valString = `${(finalVal / 1000000).toFixed(1)} MΩ`;
      } else if (finalVal >= 1000) {
        valString = `${(finalVal / 1000).toFixed(1)} kΩ`;
      } else {
        valString = `${finalVal} Ω`;
      }
      setResistorValue(`${valString} ${tol}`);
    }
  };

  // PCB Component detail definitions
  const PCB_COMPONENTS: Record<string, { title: string; reading: string; rail: string; desc: string; status: "OK" | "SHORT" }> = {
    U2: {
      title: "U2 / Hydra Charging IC",
      reading: "0.485V (Diode)",
      rail: "PP1V8_ALWAYS",
      desc: "Controls primary USB handshake. Highly prone to blowing if using cheap car chargers or damaged Lightning/USB-C cables. Symptoms: draws 0.01A, no boot, charges only when turned off.",
      status: "OK"
    },
    PMIC: {
      title: "Main Power Management IC (PMIC)",
      reading: "0.320V (Diode)",
      rail: "PP_VDD_MAIN",
      desc: "Outputs all major buck and LDO voltage rails. Liquid damage near this IC causes system reset loops and instant 19V/3.8V line shorts.",
      status: "OK"
    },
    NAND: {
      title: "Flash Storage IC (NAND)",
      reading: "0.410V (Diode)",
      rail: "PP1V8_NAND / PP0V9_NAND",
      desc: "Stores user data and iOS system files. Broken solder pads under this chip (due to drop impact) will throw restoring errors 9, 4013 or 4014.",
      status: "OK"
    },
    C3284: {
      title: "C3284 Filter Capacitor",
      reading: "0.002V (SHORT DETECTED)",
      rail: "PP_VDD_MAIN",
      desc: "A decoupling capacitor protecting the backlight booster. Under high heat load, it cracked internally and is now shorting PP_VDD_MAIN directly to ground.",
      status: "SHORT"
    },
    FPC1: {
      title: "Charging Flex FPC Connector",
      reading: "0.520V (Diode)",
      rail: "I2C3_SDA_CONN / I2C3_SCL_CONN",
      desc: "Interconnect port socket bridging charging dock telemetry to CPU. If pins are bent, iOS triggers 3-minute panics due to missing prs0 sensor.",
      status: "OK"
    }
  };

  const getPcbComponentStyle = (key: string) => {
    const isSelected = selectedPcbComponent === key;
    const isShorted = PCB_COMPONENTS[key].status === "SHORT";
    let base = "boardview-component ";
    if (isSelected) base += "selected ";
    if (isShorted && pcbHighlightShort) base += "shorted ";
    return base;
  };

  return (
    <div className="app-container">
      {/* Sleek Header */}
      <header>
        <div className="logo-section">
          <div className="logo-icon">⚡</div>
          <div>
            <h1>Microsolder AI</h1>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Professional IC Diagnostics Engine</p>
          </div>
          <span>v1.2-beta</span>
        </div>

        <nav>
          <button className={`tab-btn ${activeTab === "usb" ? "active" : ""}`} onClick={() => setActiveTab("usb")}>
            🔌 USB Diagnosis
          </button>
          <button className={`tab-btn ${activeTab === "panic" ? "active" : ""}`} onClick={() => setActiveTab("panic")}>
            📄 Panic Log Analyzer
          </button>
          <button className={`tab-btn ${activeTab === "boardview" ? "active" : ""}`} onClick={() => setActiveTab("boardview")}>
            🗺️ Boardview
          </button>
          <button className={`tab-btn ${activeTab === "microscope" ? "active" : ""}`} onClick={() => setActiveTab("microscope")}>
            🔬 Microscope AI
          </button>
          <button className={`tab-btn ${activeTab === "tickets" ? "active" : ""}`} onClick={() => setActiveTab("tickets")}>
            🎫 Repair Tickets
          </button>
          <button className={`tab-btn ${activeTab === "tools" ? "active" : ""}`} onClick={() => setActiveTab("tools")}>
            🧮 Workbench Tools
          </button>
          <button className={`tab-btn ${activeTab === "kb" ? "active" : ""}`} onClick={() => setActiveTab("kb")}>
            📚 Knowledge Base
          </button>
        </nav>
      </header>

      {/* Main Workspace Area */}
      <div className={`dashboard-grid ${["boardview", "microscope", "tools", "kb"].includes(activeTab) ? "full-width" : ""}`}>
        
        {/* SIDE PANEL (Only visible for USB and Panic tabs to show telemetry lists) */}
        {!["boardview", "microscope", "tools", "kb"].includes(activeTab) && (
          <div className="panel">
            <div className="panel-header">
              <h2>📋 Device Telemetry</h2>
            </div>
            
            {activeTab === "usb" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Choose simulated device for scanning:</p>
                <div className="form-group">
                  <select 
                    className="input-field" 
                    value={selectedMockIndex}
                    onChange={(e) => setSelectedMockIndex(parseInt(e.target.value))}
                  >
                    <option value="0">iPhone 12 Pro (Normal)</option>
                    <option value="1">Galaxy S21 Ultra (Normal)</option>
                    <option value="2">PlayStation 5 (Safe Mode)</option>
                    <option value="3">Nintendo Switch OLED (Normal)</option>
                  </select>
                </div>
                <button 
                  className="btn" 
                  disabled={scanning}
                  onClick={() => scanUsb(true)}
                >
                  {scanning ? "🔍 Scanning Ports..." : "🔄 Simulate Scan"}
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={scanning}
                  onClick={() => scanUsb(false)}
                >
                  🔍 Scan Physical USB
                </button>
              </div>
            )}

            {activeTab === "panic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500 }}>Select Demo Panic Presets</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  <button className="btn btn-secondary" onClick={() => selectPreset("prs0")}>
                    iPhone 12 Restarts (prs0)
                  </button>
                  <button className="btn btn-secondary" onClick={() => selectPreset("mic2")}>
                    Power Flex Fault (mic2)
                  </button>
                  <button className="btn btn-secondary" onClick={() => selectPreset("ans2")}>
                    NAND Read/Write Fail (ans2)
                  </button>
                  <button className="btn btn-secondary" onClick={() => selectPreset("general")}>
                    General Watchdog Panic
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  Selecting a preset will paste real-world watchdog strings into the parser and compute diagnostics steps.
                </p>
              </div>
            )}

            {activeTab === "tickets" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="flex-between">
                  <h3 style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Open Cases</h3>
                  <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={fetchTickets}>
                    🔄 Refresh
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                  {ticketsList.map(t => (
                    <div 
                      key={t.id} 
                      className={`ticket-item ${selectedTicket?.id === t.id ? "active" : ""}`}
                      onClick={() => setSelectedTicket(t)}
                    >
                      <div className="flex-between" style={{ marginBottom: "6px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: "bold" }}>{t.ticketNumber}</span>
                        <span className={`status-badge ${t.status === "COMPLETED" ? "ok" : t.status === "IN_PROGRESS" ? "warning" : "critical"}`}>
                          {t.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: "500" }}>{t.customerName} - {t.model}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.faultDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MAIN WORKSPACE CONTENT PANEL */}
        <div className="panel" style={{ flexGrow: 1 }}>

          {/* TAB 1: USB DIAGNOSIS */}
          {activeTab === "usb" && (
            <>
              <div className="panel-header">
                <h2>🔌 USB Hardware Scan Panel</h2>
                <span className={`status-badge ${usbDevice.connected ? "ok" : "critical"}`}>
                  {usbDevice.connected ? "Device Online" : "Disconnected"}
                </span>
              </div>

              <div className="grid-cols-2">
                <div className="result-card">
                  <h3>📦 Telemetry Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>Manufacturer:</span>
                      <strong>{usbDevice.brand}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>Device Model:</span>
                      <strong>{usbDevice.model}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>Serial Number:</span>
                      <strong style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{usbDevice.serialNumber}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>OS Version:</span>
                      <strong>{usbDevice.osVersion}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: "var(--text-secondary)" }}>Boot Mode:</span>
                      <span className={`status-badge ${usbDevice.bootMode === "Normal" ? "ok" : "warning"}`}>
                        {usbDevice.bootMode}
                      </span>
                    </div>
                    {usbDevice.batteryHealth && (
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Battery Health:</span>
                        <strong>{usbDevice.batteryHealth}</strong>
                      </div>
                    )}
                    {usbDevice.chargeCycles && (
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Charge Cycles:</span>
                        <strong>{usbDevice.chargeCycles}</strong>
                      </div>
                    )}
                  </div>
                  {usbDevice.warning && (
                    <div style={{ background: "var(--color-rose-glow)", border: "1px solid var(--color-rose)", padding: "10px", borderRadius: "4px", fontSize: "12px", color: "var(--color-rose)" }}>
                      ⚠️ {usbDevice.warning}
                    </div>
                  )}
                </div>

                <div className="result-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3>⚙️ Raw USB Shell Output</h3>
                  <div className="terminal-box" style={{ height: "100%", maxHeight: "none", minHeight: "180px" }}>
                    {usbDevice.rawDetails}
                  </div>
                </div>
              </div>

              {usbDevice.connected && (
                <div style={{ background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.2)", padding: "14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ color: "var(--color-cyan)", fontSize: "14px" }}>Recommended Diagnostic Workflow</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Logs suggest hardware integrity checks on common rails for {usbDevice.model}.
                    </p>
                  </div>
                  <button className="btn" onClick={() => {
                    if (usbDevice.brand === "Apple") {
                      setActiveTab("panic");
                      selectPreset("prs0");
                    } else {
                      setActiveTab("boardview");
                    }
                  }}>
                    Launch Diagnostics Workflow
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PANIC LOG ANALYZER */}
          {activeTab === "panic" && (
            <>
              <div className="panel-header">
                <h2>📄 iOS & Android Panic Log Diagnostics</h2>
                {diagnosing && <span className="status-badge warning">Analyzing Log...</span>}
              </div>

              <div className="form-group">
                <label>Paste raw log file text (or choose from the sidebar presets):</label>
                <textarea
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "12px", height: "150px", resize: "none" }}
                  placeholder="Paste log output containing 'panic(...)' or 'Missing sensor(s)'..."
                  value={panicText}
                  onChange={(e) => setPanicText(e.target.value)}
                />
              </div>

              <button className="btn" onClick={() => diagnosePanic()}>
                🔍 Diagnose Log Fault
              </button>

              {diagnosisResult && (
                <div className="grid-cols-2" style={{ marginTop: "16px" }}>
                  <div className="result-card">
                    <div className="flex-between">
                      <h3>🔬 Diagnosis Result</h3>
                      <div className="progress-bar-container" style={{ width: "100px" }}>
                        <div className="progress-bar" style={{ width: `${diagnosisResult.confidence * 100}%` }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--color-cyan)" }}>
                        {Math.round(diagnosisResult.confidence * 100)}% Conf.
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Suspected Failure</span>
                        <p style={{ fontWeight: "bold", fontSize: "16px", color: "var(--color-rose)" }}>{diagnosisResult.suspectedFault}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Sensor / Subsystem</span>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: "bold" }}>{diagnosisResult.parsedSensor || "N/A"}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Diagnostics Description</span>
                        <p style={{ fontSize: "13px", lineHeight: "1.4", color: "var(--text-secondary)" }}>{diagnosisResult.description}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Power Rails / Communication Lines to check</span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                          {diagnosisResult.relatedRails.map((r, i) => (
                            <span 
                              key={i} 
                              style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-cyan)" }}
                              onClick={() => {
                                // Jump to boardview and highlight
                                if (r === "PP_VDD_MAIN") {
                                  setSelectedPcbComponent("C3284");
                                } else if (r.includes("I2C3")) {
                                  setSelectedPcbComponent("FPC1");
                                } else if (r.includes("NAND")) {
                                  setSelectedPcbComponent("NAND");
                                }
                                setActiveTab("boardview");
                              }}
                              className="pointer"
                              title="Click to view line in Boardview"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="result-card">
                    <h3>🛠️ Step-by-Step Troubleshooting Checklist</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {diagnosisResult.steps.map((step, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px" }}>
                          <input type="checkbox" style={{ marginTop: "3px" }} />
                          <span style={{ color: "var(--text-secondary)" }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 3: BOARDVIEW SCHEMATICS */}
          {activeTab === "boardview" && (
            <>
              <div className="panel-header">
                <h2>🗺️ Logic Board Interactive Schematic Boardview</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className={`btn ${pcbHighlightShort ? "btn-danger" : "btn-secondary"}`} 
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => {
                      setPcbHighlightShort(!pcbHighlightShort);
                      if (!pcbHighlightShort) {
                        setSelectedPcbComponent("C3284"); // Force select shorted capacitor
                      }
                    }}
                  >
                    🔥 Highlight Shorted Component
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
                <div className="boardview-canvas-wrapper">
                  <div className="boardview-grid"></div>
                  
                  {/* Visual Motherboard */}
                  <div className="boardview-pcb">
                    {/* CPU Socket overlay */}
                    <div style={{ position: "absolute", top: "40px", left: "220px", width: "120px", height: "120px", background: "rgba(0,0,0,0.3)", border: "2px solid #3b82f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", fontWeight: "bold" }}>
                      A14 CPU (RAM Layer)
                    </div>

                    {/* Component: U2 Charging IC */}
                    <div 
                      className={getPcbComponentStyle("U2")} 
                      style={{ top: "30px", left: "60px", width: "60px", height: "50px" }}
                      onClick={() => setSelectedPcbComponent("U2")}
                    >
                      U2_HYDRA
                    </div>

                    {/* Component: Main PMIC */}
                    <div 
                      className={getPcbComponentStyle("PMIC")} 
                      style={{ top: "110px", left: "60px", width: "80px", height: "70px" }}
                      onClick={() => setSelectedPcbComponent("PMIC")}
                    >
                      PMIC_MAIN
                    </div>

                    {/* Component: NAND Storage */}
                    <div 
                      className={getPcbComponentStyle("NAND")} 
                      style={{ top: "110px", left: "400px", width: "100px", height: "90px" }}
                      onClick={() => setSelectedPcbComponent("NAND")}
                    >
                      NAND_FLASH
                    </div>

                    {/* Component: Backlight shorted Capacitor C3284 */}
                    <div 
                      className={getPcbComponentStyle("C3284")} 
                      style={{ top: "200px", left: "230px", width: "30px", height: "20px" }}
                      onClick={() => setSelectedPcbComponent("C3284")}
                    >
                      C3284
                    </div>

                    {/* Component: Charge Port FPC Connector */}
                    <div 
                      className={getPcbComponentStyle("FPC1")} 
                      style={{ top: "240px", left: "20px", width: "110px", height: "24px" }}
                      onClick={() => setSelectedPcbComponent("FPC1")}
                    >
                      J5700_FPC
                    </div>
                  </div>
                </div>

                <div className="result-card">
                  <h3>🔍 Pin / Component telemetry</h3>
                  {selectedPcbComponent ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                      <strong style={{ fontSize: "16px", color: "var(--color-cyan)" }}>
                        {PCB_COMPONENTS[selectedPcbComponent].title}
                      </strong>
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Primary Rail:</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{PCB_COMPONENTS[selectedPcbComponent].rail}</span>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Expected Value:</span>
                        <strong style={{ color: PCB_COMPONENTS[selectedPcbComponent].status === "SHORT" ? "var(--color-rose)" : "var(--color-emerald)" }}>
                          {PCB_COMPONENTS[selectedPcbComponent].reading}
                        </strong>
                      </div>
                      <p style={{ color: "var(--text-secondary)", lineHeight: 1.4, marginTop: "8px" }}>
                        {PCB_COMPONENTS[selectedPcbComponent].desc}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Select any PCB components on the layout boardview to fetch technical parameters.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 4: MICROSCOPE AI */}
          {activeTab === "microscope" && (
            <>
              <div className="panel-header">
                <h2>🔬 Microscope and Thermal Image Scanner Mockup</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className={`btn ${microscopePhoto === "board_clean" ? "" : "btn-secondary"}`} onClick={() => { setMicroscopePhoto("board_clean"); setDetectionOverlay(false); }}>
                    Standard Board View
                  </button>
                  <button className={`btn ${microscopePhoto === "board_corrosion" ? "" : "btn-secondary"}`} onClick={() => { setMicroscopePhoto("board_corrosion"); setDetectionOverlay(false); }}>
                    Corroded Component View
                  </button>
                  <button className={`btn ${microscopePhoto === "board_thermal" ? "" : "btn-secondary"}`} onClick={() => { setMicroscopePhoto("board_thermal"); setDetectionOverlay(false); }}>
                    Thermal Hotspot View
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
                <div className="image-analyzer-container">
                  {/* Draw simulated board elements inside canvas or absolute divs to represent microscopic image */}
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                    
                    {microscopePhoto === "board_clean" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "220px", height: "120px", background: "#1e3a8a", border: "4px solid #172554", borderRadius: "10px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Silicon IC Chip</span>
                          {/* Solder pins */}
                          <div style={{ position: "absolute", bottom: "-8px", left: "20px", display: "flex", gap: "12px" }}>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                          </div>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Solder balls intact, zero signs of thermal damage or liquid contact.</p>
                      </div>
                    )}

                    {microscopePhoto === "board_corrosion" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", position: "relative" }}>
                        <div style={{ width: "220px", height: "120px", background: "#1e3a8a", border: "4px solid #172554", borderRadius: "10px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Silicon IC Chip</span>
                          {/* Corrosion green overlay */}
                          <div style={{ position: "absolute", bottom: "-12px", left: "20px", display: "flex", gap: "12px" }}>
                            <div style={{ width: "12px", height: "12px", background: "#059669", border: "1px solid #10b981", borderRadius: "50%", boxShadow: "0 0 6px #10b981" }}></div>
                            <div style={{ width: "12px", height: "12px", background: "#059669", border: "1px solid #10b981", borderRadius: "50%", boxShadow: "0 0 6px #10b981" }}></div>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                            <div style={{ width: "8px", height: "8px", background: "#cbd5e1", borderRadius: "50%" }}></div>
                          </div>
                        </div>
                        {detectionOverlay && (
                          <div className="analysis-overlay" style={{ top: "60px", left: "120px", width: "80px", height: "50px" }}></div>
                        )}
                      </div>
                    )}

                    {microscopePhoto === "board_thermal" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", position: "relative" }}>
                        <div style={{ width: "220px", height: "120px", background: "#581c87", border: "4px solid #3b0764", borderRadius: "10px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "14px", fontWeight: "bold" }}>CPU Silicon</span>
                          {/* Hotspot red circle */}
                          <div style={{ position: "absolute", top: "20px", left: "40px", width: "40px", height: "40px", borderRadius: "50%", background: "radial-gradient(circle, #ef4444 0%, #f97316 60%, transparent 100%)", boxShadow: "0 0 30px #ef4444" }}></div>
                        </div>
                        {detectionOverlay && (
                          <div className="analysis-overlay" style={{ top: "15px", left: "150px", width: "70px", height: "60px" }}></div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                <div className="result-card">
                  <h3>🧠 AI Visual Classifier</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Click Scan below to execute edge-detection and classify board anomalies.</p>
                  
                  <button className="btn" onClick={() => setDetectionOverlay(true)}>
                    🔍 Scan Photo with AI
                  </button>

                  {detectionOverlay && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                      <strong style={{ color: "var(--color-rose)" }}>
                        {microscopePhoto === "board_corrosion" ? "Corrosion Detected" : "Thermal Anomaly Detected"}
                      </strong>
                      <p style={{ color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.4 }}>
                        {microscopePhoto === "board_corrosion" 
                          ? "Green mold and oxidation detected on pins 1 & 2 of the Charging IC. High risk of shorted capacitors on the associated input lines."
                          : "Thermal hotspot (46.2°C) detected near PMIC Capacitor array. Represents abnormal power dissipation due to secondary line load short."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 5: REPAIR TICKETS */}
          {activeTab === "tickets" && (
            <>
              <div className="panel-header">
                <h2>🎫 Repair Tickets & Voltage Logger</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                {/* Form to Create Ticket */}
                <form onSubmit={handleSubmitTicket} className="result-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3>🆕 Create Repair Ticket</h3>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newCustName} 
                        onChange={(e) => setNewCustName(e.target.value)} 
                        placeholder="John Doe" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Estimated Charge ($)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={newCost} 
                        onChange={(e) => setNewCost(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Manufacturer</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newBrand} 
                        onChange={(e) => setNewBrand(e.target.value)} 
                        placeholder="e.g. Apple" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Device Model</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newModel} 
                        onChange={(e) => setNewModel(e.target.value)} 
                        placeholder="e.g. iPhone 12" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Symptom/Fault Description</label>
                    <textarea 
                      className="input-field" 
                      style={{ height: "60px", resize: "none" }}
                      value={newFault} 
                      onChange={(e) => setNewFault(e.target.value)} 
                      placeholder="e.g. draws 0.05A from charge block, short on PP_VDD_MAIN" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Internal Workbench Notes</label>
                    <textarea 
                      className="input-field" 
                      style={{ height: "60px", resize: "none" }}
                      value={newNotes} 
                      onChange={(e) => setNewNotes(e.target.value)} 
                      placeholder="Testing points, diode readings, etc." 
                    />
                  </div>
                  <button type="submit" className="btn">
                    💾 Create Ticket
                  </button>
                </form>

                {/* View Ticket Details & Log measurements */}
                <div className="result-card">
                  <h3>🔍 Selected Ticket Overview</h3>
                  {selectedTicket ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                      <div className="flex-between">
                        <strong style={{ fontSize: "16px", color: "var(--color-cyan)" }}>{selectedTicket.ticketNumber}</strong>
                        <span className={`status-badge ${selectedTicket.status === "COMPLETED" ? "ok" : "warning"}`}>{selectedTicket.status}</span>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Customer:</span>
                        <strong>{selectedTicket.customerName}</strong>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Device:</span>
                        <strong>{selectedTicket.brand} {selectedTicket.model}</strong>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: "var(--text-secondary)" }}>Symptom:</span>
                        <strong>{selectedTicket.faultDescription}</strong>
                      </div>
                      
                      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "10px", marginTop: "10px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Technician Notes:</span>
                        <p style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", fontSize: "12px", color: "var(--text-secondary)", minHeight: "60px" }}>
                          {selectedTicket.notes || "No notes logged."}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Logged Rails:</span>
                        <span style={{ fontSize: "11px", color: "var(--color-cyan)" }}>Mapped Rails: {Object.keys(selectedTicket.measurements).length}</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {Object.entries(selectedTicket.measurements).map(([rail, val]) => (
                          <div key={rail} className="flex-between" style={{ background: "rgba(0,0,0,0.1)", padding: "6px 10px", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                            <span>{rail}</span>
                            <span>{val.voltage}V <span style={{ color: val.status === "SHORTED" ? "var(--color-rose)" : "var(--color-emerald)", marginLeft: "8px", fontWeight: "bold" }}>({val.status})</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-muted)" }}>Select a ticket from the left panel to review notes, voltages, and client status.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 6: WORKBENCH TOOLS */}
          {activeTab === "tools" && (
            <>
              <div className="panel-header">
                <h2>🧮 Technician Workbench Calculators</h2>
              </div>

              <div className="calculator-grid">
                
                {/* Ohm's Law Calculator */}
                <div className="result-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3 style={{ color: "var(--color-cyan)" }}>⚡ Ohm's Law Solver</h3>
                  <div className="form-group">
                    <label>Voltage (V)</label>
                    <input type="number" step="any" className="input-field" value={ohmVolts} onChange={(e) => setOhmVolts(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Current (Amps)</label>
                    <input type="number" step="any" className="input-field" value={ohmAmps} onChange={(e) => setOhmAmps(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Resistance (Ohms)</label>
                    <input type="number" step="any" className="input-field" value={ohmOhms} onChange={(e) => setOhmOhms(e.target.value)} />
                  </div>
                  
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => calculateOhm("V")}>Solve V</button>
                    <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => calculateOhm("I")}>Solve I</button>
                    <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => calculateOhm("R")}>Solve R</button>
                  </div>

                  {ohmCalcResult && (
                    <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", fontSize: "13px" }}>
                      <p>Power Dissipation: <strong>{ohmCalcResult.watts} W (Watts)</strong></p>
                    </div>
                  )}
                </div>

                {/* Resistor Color Code Calculator */}
                <div className="result-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3 style={{ color: "var(--color-cyan)" }}>🎨 Resistor Band Colors</h3>
                  
                  {/* Color display */}
                  <div className="resistor-display" style={{ margin: "10px 0" }}>
                    <div className="resistor-band" style={{ backgroundColor: resistorBands[0] }}></div>
                    <div className="resistor-band" style={{ backgroundColor: resistorBands[1] }}></div>
                    <div className="resistor-band" style={{ backgroundColor: resistorBands[2] }}></div>
                    <div className="resistor-band" style={{ backgroundColor: resistorBands[3] }}></div>
                  </div>

                  <div className="grid-cols-2" style={{ gap: "10px" }}>
                    <div className="form-group">
                      <label>1st Digit</label>
                      <select className="input-field" value={resistorBands[0]} onChange={(e) => handleResistorChange(0, e.target.value)}>
                        <option value="black">Black (0)</option>
                        <option value="brown">Brown (1)</option>
                        <option value="red">Red (2)</option>
                        <option value="orange">Orange (3)</option>
                        <option value="yellow">Yellow (4)</option>
                        <option value="green">Green (5)</option>
                        <option value="blue">Blue (6)</option>
                        <option value="violet">Violet (7)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>2nd Digit</label>
                      <select className="input-field" value={resistorBands[1]} onChange={(e) => handleResistorChange(1, e.target.value)}>
                        <option value="black">Black (0)</option>
                        <option value="brown">Brown (1)</option>
                        <option value="red">Red (2)</option>
                        <option value="orange">Orange (3)</option>
                        <option value="yellow">Yellow (4)</option>
                        <option value="green">Green (5)</option>
                        <option value="blue">Blue (6)</option>
                        <option value="violet">Violet (7)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-cols-2" style={{ gap: "10px" }}>
                    <div className="form-group">
                      <label>Multiplier</label>
                      <select className="input-field" value={resistorBands[2]} onChange={(e) => handleResistorChange(2, e.target.value)}>
                        <option value="black">Black (x1)</option>
                        <option value="brown">Brown (x10)</option>
                        <option value="red">Red (x100)</option>
                        <option value="orange">Orange (x1k)</option>
                        <option value="yellow">Yellow (x10k)</option>
                        <option value="green">Green (x100k)</option>
                        <option value="blue">Blue (x1M)</option>
                        <option value="gold">Gold (x0.1)</option>
                        <option value="silver">Silver (x0.01)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tolerance</label>
                      <select className="input-field" value={resistorBands[3]} onChange={(e) => handleResistorChange(3, e.target.value)}>
                        <option value="gold">Gold (±5%)</option>
                        <option value="silver">Silver (±10%)</option>
                        <option value="brown">Brown (±1%)</option>
                        <option value="red">Red (±2%)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "4px", fontSize: "14px", textAlign: "center" }}>
                    Calculated Resistance: <strong>{resistorValue}</strong>
                  </div>
                </div>

                {/* Voltage Drop Calculator */}
                <div className="result-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3 style={{ color: "var(--color-cyan)" }}>📉 Voltage Drop Line</h3>
                  <div className="form-group">
                    <label>Source Voltage (V)</label>
                    <input type="number" defaultValue="5.0" id="vdSource" className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Current Draw (Amps)</label>
                    <input type="number" defaultValue="1.5" id="vdCurrent" className="input-field" />
                  </div>
                  <div className="form-group">
                    <label>Wire Resistance (Ohms)</label>
                    <input type="number" defaultValue="0.15" id="vdRes" className="input-field" />
                  </div>
                  <button className="btn" onClick={() => {
                    const src = parseFloat((document.getElementById("vdSource") as HTMLInputElement).value);
                    const cur = parseFloat((document.getElementById("vdCurrent") as HTMLInputElement).value);
                    const res = parseFloat((document.getElementById("vdRes") as HTMLInputElement).value);
                    if (!isNaN(src) && !isNaN(cur) && !isNaN(res)) {
                      const drop = cur * res;
                      const finalV = src - drop;
                      alert(`Voltage Drop: ${drop.toFixed(3)}V\nFinal Terminal Voltage: ${finalV.toFixed(3)}V`);
                    }
                  }}>
                    Calculate Drop
                  </button>
                </div>

              </div>
            </>
          )}

          {/* TAB 7: KNOWLEDGE BASE */}
          {activeTab === "kb" && (
            <>
              <div className="panel-header">
                <h2>📚 IC Repair Knowledge Base</h2>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: "250px" }}
                  placeholder="Search guides (e.g. prs0)..." 
                  value={searchKb}
                  onChange={(e) => setSearchKb(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {kbGuides
                  .filter(guide => 
                    guide.title.toLowerCase().includes(searchKb.toLowerCase()) || 
                    guide.device.toLowerCase().includes(searchKb.toLowerCase())
                  )
                  .map(guide => (
                    <div key={guide.id} className="result-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="flex-between">
                        <h3 style={{ fontSize: "16px" }}>{guide.title}</h3>
                        <span style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
                          {guide.category} • {guide.device}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, background: "rgba(0,0,0,0.15)", padding: "14px", borderRadius: "6px" }}>
                        <pre style={{ fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap" }}>{guide.content}</pre>
                      </div>
                    </div>
                  ))
                }
              </div>
            </>
          )}

        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--border-glass)", fontSize: "12px", color: "var(--text-muted)" }}>
        <p>© 2026 Microsolder AI. All rights reserved.</p>
        <p>Diagnostics Sandbox • Secured via Secure-Access Sandbox</p>
      </footer>
    </div>
  );
}

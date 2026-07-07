export interface PanicDiagnosis {
  parsedSensor: string | null;
  suspectedFault: string;
  confidence: number;
  description: string;
  recommendations: string;
  steps: string[];
  relatedRails: string[];
}

interface PanicRule {
  pattern: RegExp;
  sensor: string;
  fault: string;
  confidence: number;
  description: string;
  recommendations: string;
  steps: string[];
  rails: string[];
}

const PANIC_RULES: PanicRule[] = [
  {
    pattern: /Missing sensor\(s\):\s*(prs0)/i,
    sensor: "prs0",
    fault: "Charging Port Flex Assembly (Barometer)",
    confidence: 0.98,
    description: "The prs0 sensor is the barometer, which sits on the charging port flex cable assembly. iOS periodically checks this sensor; if it cannot communicate over the I2C bus (often due to damage during screen replacement, water damage, or a low-quality replacement port), the CPU triggers a watchdog panic and restarts every 3 minutes.",
    recommendations: "Inspect the charging port flex cable FPC connector. If recently repaired, the flex itself is likely torn or defective. Test with a known-good OEM-quality charging port flex.",
    steps: [
      "Disconnect battery and then disconnect the charging port flex.",
      "Check the FPC connector on the motherboard under a microscope for bent pins or corrosion.",
      "Measure diode mode readings on the charging port I2C data (SDA/SCL) and power lines.",
      "Connect a known-good test flex cable externally and verify if the 3-minute restart loop stops.",
      "Replace the charging port assembly if the external test succeeds."
    ],
    rails: ["PP_VAR_S2_LDO1", "I2C3_SDA_CONN", "I2C3_SCL_CONN"]
  },
  {
    pattern: /Missing sensor\(s\):\s*(mic1)/i,
    sensor: "mic1",
    fault: "Charging Port Flex (Bottom Microphone)",
    confidence: 0.95,
    description: "The mic1 sensor represents the primary bottom microphone thermal/telemetry channel on the charging port flex. Watchdog restarts occur when the system cannot query this sensor.",
    recommendations: "Perform visual inspection of the charge port assembly and replace with a high-quality flex.",
    steps: [
      "Remove logic board or isolate bottom flex.",
      "Inspect FPC connector pins under a microscope for liquid damage or bent contacts.",
      "Check diode mode readings on the mic1 power lines.",
      "Swap charging port flex with a working reference unit."
    ],
    rails: ["PP_MIC_BIAS_CONN", "I2C3_SDA", "I2C3_SCL"]
  },
  {
    pattern: /Missing sensor\(s\):\s*(mic2)/i,
    sensor: "mic2",
    fault: "Power Button / Flash Light Flex Assembly (Top Microphone)",
    confidence: 0.95,
    description: "The mic2 sensor represents the noise-cancelling microphone and ambient sensor situated on the power/volume button flex assembly. A failure in communications on this branch causes panic resets.",
    recommendations: "Inspect the power button/flash flex cable. Ensure it is plugged in correctly and has no micro-tears.",
    steps: [
      "Disconnect power button flex and inspect the motherboard FPC connector pins.",
      "Check for tears in the thin sections of the power button flex cable.",
      "Test functionality with a new power button flex.",
      "Measure voltage drop on the power button line to verify PMIC sensing."
    ],
    rails: ["PP1V8_ALWAYS", "BUTTON_TO_AP_L", "I2C0_SDA", "I2C0_SCL"]
  },
  {
    pattern: /Missing sensor\(s\):\s*(tg0b)/i,
    sensor: "tg0b",
    fault: "Battery Gas Gauge / NTC Thermistor Failure",
    confidence: 0.97,
    description: "The tg0b sensor represents the battery temperature monitor (thermistor) or gas gauge communication line (HDQ/I2C). If the CPU cannot read the battery's temperature or state, it panics to protect against thermal runaway.",
    recommendations: "Inspect the battery FPC connector on the logic board. The tiny middle pins (gas gauge data and clock lines) are easily bent or broken during DIY battery replacements.",
    steps: [
      "Under microscope, check if the battery connector socket on the board has spread or bent contacts.",
      "Measure diode mode on battery data/clock lines (typically 0.3V - 0.6V depending on model).",
      "Check for missing or knocked-off filters/resistors near the battery connector.",
      "Test with another battery to rule out a defective BMS board on the battery."
    ],
    rails: ["PP_BATT_VCC", "BATT_CON_TO_PMU_BI_GG_SDA", "BATT_CON_TO_PMU_BI_GG_SCL"]
  },
  {
    pattern: /ans2|NAND\s*(?:write|read|open|flash|corrupt|panic)/i,
    sensor: "ans2",
    fault: "NAND Flash / Storage IC Issue",
    confidence: 0.90,
    description: "The Apple NAND Storage (ans2) subsystem reports a critical access error. This occurs when the CPU is unable to read/write system sectors, leading to instant kernel panic. Can be caused by cracked solder joints under the NAND, corrupted filesystem, or physical degradation of the chip.",
    recommendations: "Attempt to restore the device using DFU mode. If it fails with Error 9, 4013, or 4014, it is a hardware NAND/EEPROM communication fault.",
    steps: [
      "Check voltages on the NAND power rails (1.2V, 1.8V, 2.6V).",
      "Measure diode mode on capacitor arrays surrounding the NAND chip to find shorts to ground.",
      "If rails are shorted, inject low voltage (1V) and locate the hot capacitor with freeze spray or a thermal camera.",
      "If diode readings are correct but device fails to boot/restore, the NAND must be desoldered, reprogrammed (using a JCID or similar programmer), and reballed."
    ],
    rails: ["PP0V9_NAND", "PP1V8_NAND", "PP2V6_NAND"]
  },
  {
    pattern: /i2c[0-4]_s(da|cl)\s*sensor|i2c\s*bus\s*stuck/i,
    sensor: "i2c",
    fault: "I2C Protocol Bus Line Short / Stalled",
    confidence: 0.85,
    description: "One of the Inter-Integrated Circuit (I2C) communication lines is shorted to ground or pulled low, stalling CPU communication. Common culprits are liquid-damaged front sensor assemblies (Proximity/ALS) or audio IC lines.",
    recommendations: "Disconnect the front sensor flex assembly (earpiece speaker/proximity flex) and boot the device. If it boots successfully, the fault is on the flex assembly.",
    steps: [
      "Disconnect all non-essential peripheral cables (charging port, cameras, proximity flex).",
      "Measure diode mode on each I2C bus line relative to ground. Standard readings should be around 350-450mV.",
      "If a line reads 0.00V (shorted), trace the line on your boardview to find components connected to it.",
      "Inspect the Ambient Light Sensor (ALS) and Proximity sensor under microscope for green corrosion."
    ],
    rails: ["I2C0_SDA", "I2C0_SCL", "I2C1_SDA", "I2C1_SCL", "PP1V8_IO"]
  },
  {
    pattern: /thermal\s*sensor|sensor\s*T[A-Z0-9]+/i,
    sensor: "thermal",
    fault: "Logic Board Thermal Sensor Disconnection",
    confidence: 0.80,
    description: "A thermal sensor on the board (e.g. ambient, CPU, GPU, or charging thermal) is returning out-of-bounds readings or is unreachable. Common after drop damage or shell bending.",
    recommendations: "Trace specific sensor line using schematic to inspect associated pull-up resistors.",
    steps: [
      "Examine thermal sensor resistors near the PMIC or CPU.",
      "Measure resistance values of pull-up resistors (typically 10k or 100k ohms).",
      "Replace missing/damaged resistors near the edge of the logic board."
    ],
    rails: ["PP1V8_S2", "THERM_AP_BI_THERM_SENS_CONN"]
  }
];

export function parsePanicLog(logText: string): PanicDiagnosis {
  if (!logText || logText.trim().length === 0) {
    return {
      parsedSensor: null,
      suspectedFault: "Unknown / Empty Log",
      confidence: 0.1,
      description: "No text was detected in the log. Please upload or paste a valid log file.",
      recommendations: "Ensure you are copying the entire log file. For iPhones, look for 'panic-full' logs in Analytics Data.",
      steps: ["Paste the log text manually into the analysis box.", "Check for logs under Settings > Privacy > Analytics Data."],
      relatedRails: []
    };
  }

  // Iterate over pre-defined rules
  for (const rule of PANIC_RULES) {
    if (rule.pattern.test(logText)) {
      return {
        parsedSensor: rule.sensor,
        suspectedFault: rule.fault,
        confidence: rule.confidence,
        description: rule.description,
        recommendations: rule.recommendations,
        steps: rule.steps,
        relatedRails: rule.rails
      };
    }
  }

  // Fallback for general logs
  if (logText.includes("panic(") || logText.includes("Kernel panic")) {
    // Attempt custom regex extraction of missing sensor name
    const match = logText.match(/Missing sensor\(s\):\s*([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      const sensorName = match[1].toLowerCase();
      return {
        parsedSensor: sensorName,
        suspectedFault: `Missing Sensor "${sensorName}"`,
        confidence: 0.75,
        description: `The panic log explicitly lists a missing sensor: "${sensorName}". The CPU could not fetch thermal or voltage levels from this sensor, forcing a restart loop.`,
        recommendations: `Examine the schematics for lines carrying the "${sensorName}" signal. This is usually connected to a peripheral flex cable or an I2C/I3C channel.`,
        steps: [
          `Find sensor "${sensorName}" in boardview schematics.`,
          "Identify peripheral modules connected to this line (e.g. charging ports, power buttons, cameras).",
          "Disconnect the modules one-by-one to isolate which board connector or flex cable is faulty.",
          "Check pull-up resistors on the communication bus for the sensor."
        ],
        relatedRails: ["PP1V8_S2", "I2C_SDA", "I2C_SCL"]
      };
    }

    return {
      parsedSensor: "general_panic",
      suspectedFault: "Generic Kernel Panic / Watchdog Timeout",
      confidence: 0.60,
      description: "A kernel panic was detected, but the log did not specify a known thermal sensor. This is usually caused by CPU/RAM solder fracturing (common in bent frames), PMIC failures, or a corrupt operating system.",
      recommendations: "Rule out software by restoring the device. Check current draw using a DC power supply to identify short circuits prior to boot.",
      steps: [
        "Connect the board to a DC power supply and monitor the boot current curve.",
        "Check basic power rails (PPBUS_G3H, PP_VDD_MAIN) for shorts to ground.",
        "Attempt DFU/Recovery restore and check for specific error codes.",
        "Consider reballing the CPU/RAM sandwich if the device boot-loops with erratic current consumption (e.g. jumping straight to 200mA and dropping)."
      ],
      relatedRails: ["PP_VDD_MAIN", "PP_VDD_CPU", "PP1V8_ALWAYS"]
    };
  }

  // General Android logcat or system error
  if (logText.includes("FATAL EXCEPTION") || logText.includes("DEBUG   : Pid")) {
    return {
      parsedSensor: "android_system",
      suspectedFault: "Android Software Crash or Tombstone",
      confidence: 0.70,
      description: "Detected a fatal Android runtime exception or native crash tombstone. This could be software-related, or hardware-related if a system-critical IC (like Wifi, Audio IC, or PMIC) stops communicating.",
      recommendations: "Look up the crashed process name. If it mentions Bluetooth/Wifi stack, inspect the WiFi IC.",
      steps: [
        "Read the log trace below 'FATAL EXCEPTION' to identify the failing package or library.",
        "If it references hardware drivers (e.g., camera, sensors, audio), inspect those physical connectors.",
        "Perform a factory reset via recovery to rule out OS corruption."
      ],
      relatedRails: ["PP1V8_IO", "PP_VDD_CORE"]
    };
  }

  return {
    parsedSensor: null,
    suspectedFault: "Unrecognized Log Format / Symptom Input",
    confidence: 0.40,
    description: "The log does not match typical kernel panic signatures. It was treated as a textual symptom description.",
    recommendations: "You can enter symptoms directly (e.g. 'iPhone 12 no power') or upload a raw apple 'panic-full' log.",
    steps: [
      "Verify if the log file contains the word 'panic' or 'Missing sensor'.",
      "Check that the text pasted is from a raw console output or crash report.",
      "Check other diagnostics methods like USB Diagnosis or Board-level checklists."
    ],
    relatedRails: []
  };
}

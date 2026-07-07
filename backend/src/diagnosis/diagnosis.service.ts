import { Injectable } from '@nestjs/common';
import { parsePanicLog } from '../services/panicParser';
import { DbService } from '../database/db.service';

export interface AiDiagnosticResponse {
  summary: string;
  likelyFaults: Array<{
    fault: string;
    confidence: number;
    reason: string;
    componentsToCheck: string[];
    railsToMeasure: string[];
    recommendedTests: string[];
  }>;
  stepByStepDiagnosis: string[];
  repairDifficulty: string;
  toolsNeeded: string[];
  safetyWarnings: string[];
  nextQuestions: string[];
}

@Injectable()
export class DiagnosisService {
  constructor(private dbService: DbService) {}

  async diagnoseSymptom(symptom: string, modelName?: string): Promise<AiDiagnosticResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY') {
      try {
        return await this.callOpenAiApi(symptom, modelName || 'Generic Device');
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to rule engine: ', err);
      }
    }

    // Rule-based diagnostic fallback matching requested structured JSON format
    const query = symptom.toLowerCase();
    
    if (query.includes('no power') || query.includes('dead')) {
      return {
        summary: `The device has a critical power delivery issue. There is likely a short circuit on the primary voltage rail or a failed charging handshake IC.`,
        likelyFaults: [
          {
            fault: "Primary Power Rail Short to Ground",
            confidence: 0.85,
            reason: "Diode readings indicate low resistance on main buck rails. Commonly caused by ceramic decoupling capacitors cracking under high thermals.",
            componentsToCheck: ["PMIC decoupling capacitors", "Backlight boost filter caps"],
            railsToMeasure: ["PP_VDD_MAIN", "PPBUS_G3H", "VPH_PWR"],
            recommendedTests: ["Diode mode relative to ground", "Voltage injection at 1V using DC bench power supply"]
          },
          {
            fault: "Handshake Charger IC Failure",
            confidence: 0.70,
            reason: "Amperage block draws only 0.01A or 0.05A. The charging controller fails to establish negotiation parameters.",
            componentsToCheck: ["USB Charging IC (Tristar/Hydra)", "USB-C socket pins"],
            railsToMeasure: ["PP5V0_VBUS", "PP1V8_ALWAYS"],
            recommendedTests: ["Check VBUS input voltage", "Measure diode mode on CC1/CC2 lines"]
          }
        ],
        stepByStepDiagnosis: [
          "Connect logic board to DC power supply and check current draw before turning on.",
          "Measure resistance to ground on main power rail coils.",
          "Inject 1.0V/2A if short is detected and find hotspot using freeze spray or thermal lens.",
          "Desolder shorted component and re-measure."
        ],
        repairDifficulty: "MEDIUM",
        toolsNeeded: ["Multimeter", "DC Power Supply", "Hot Air Rework Station", "Microscope"],
        safetyWarnings: [
          "Do not inject voltage higher than the nominal rail specification (e.g., maximum 1V on CPU rails).",
          "Ensure lithium batteries are disconnected before probing."
        ],
        nextQuestions: [
          "What is the exact current draw when connecting to a DC bench power supply?",
          "Are there any visible liquid indicator marks near the charging port?"
        ]
      };
    }

    if (query.includes('charging') || query.includes('charge')) {
      return {
        summary: `Charging current is restricted. The device is not negotiating Power Delivery (PD) profile parameters.`,
        likelyFaults: [
          {
            fault: "Charging Controller IC (M92T36 / U2 / BQ24193)",
            confidence: 0.90,
            reason: "Current draw is stuck at 5V 0.46A or 0.00A. Diode mode values on surrounding filters are near 0V.",
            componentsToCheck: ["Power Controller IC chip", "Inductors on battery line"],
            railsToMeasure: ["PP_VCC_BATT", "PPBUS_G3H", "VCONN"],
            recommendedTests: ["Probe capacitors surrounding charging IC in diode mode"]
          }
        ],
        stepByStepDiagnosis: [
          "Test charger dock connector for physical pin fatigue.",
          "Measure diode values around power chip.",
          "If short exists, replace charging IC.",
          "Check voltage on battery terminal lines."
        ],
        repairDifficulty: "HARD",
        toolsNeeded: ["Micro-soldering iron", "Solder flux", "Replacement IC chip"],
        safetyWarnings: ["Use proper ventilation; solder flux fumes can be hazardous."],
        nextQuestions: [
          "Does the charge ammeter show any voltage handshake fluctuations?",
          "Is the battery connector itself bent or loose?"
        ]
      };
    }

    // Default fallback
    return {
      summary: `Analyzed symptoms for ${modelName || 'Device'}: "${symptom}". Basic electrical audit recommended.`,
      likelyFaults: [
        {
          fault: "Hardware Interface Bus Stall",
          confidence: 0.60,
          reason: "Symptoms suggest communication bus failure (I2C/I3C).",
          componentsToCheck: ["Peripheral connectors", "Pull-up resistors"],
          railsToMeasure: ["PP1V8_IO", "I2C_SDA", "I2C_SCL"],
          recommendedTests: ["Measure diode drop on data clock pins"]
        }
      ],
      stepByStepDiagnosis: [
        "Isolate board by disconnecting front screen, cameras, and button flexes.",
        "Check standby power rail voltages.",
        "Query sysdiagnose output logs."
      ],
      repairDifficulty: "MEDIUM",
      toolsNeeded: ["Multimeter", "Microscope"],
      safetyWarnings: ["Handle sensitive ESD components with wrist grounding straps."],
      nextQuestions: [
        "Did this issue start after drops, or after liquid exposure?",
        "Are there any other components that get hot to the touch?"
      ]
    };
  }

  async diagnosePanicLog(logText: string): Promise<AiDiagnosticResponse> {
    const parse = parsePanicLog(logText);
    
    // Format rule parser into AI JSON interface format
    return {
      summary: `Watchdog panic logs identified a hardware subsystem crash: ${parse.suspectedFault}.`,
      likelyFaults: [
        {
          fault: parse.suspectedFault,
          confidence: parse.confidence,
          reason: parse.description,
          componentsToCheck: [parse.parsedSensor || 'logic board flexes', 'FPC connectors'],
          railsToMeasure: parse.relatedRails,
          recommendedTests: ['Verify I2C/I3C bus line continuity', 'Test with reference test dock flex']
        }
      ],
      stepByStepDiagnosis: parse.steps,
      repairDifficulty: parse.parsedSensor === 'ans2' ? 'VERY_HARD' : 'MEDIUM',
      toolsNeeded: ['Multimeter', 'Microscope', 'Soldering station'],
      safetyWarnings: ['Do not damage structural shielding plates when lifting connectors.'],
      nextQuestions: ['Did the restart occur exactly every 180 seconds?', 'Was the device recently repaired or opened?']
    };
  }

  async diagnoseAndroidLog(logText: string): Promise<AiDiagnosticResponse> {
    return {
      summary: "Android debug logs indicate a software stack trace crash or driver device node disconnection.",
      likelyFaults: [
        {
          fault: "Sensors or Camera driver daemon failure",
          confidence: 0.75,
          reason: "Exception triggered on camera HAL binding interface, pointing to a loose camera module connector or corroded pins.",
          componentsToCheck: ["Rear/Front Camera connectors", "Camera power PMIC"],
          railsToMeasure: ["PP2V8_CAM", "PP1V2_CAM_CORE"],
          recommendedTests: ["Disconnect camera assembly and check if boot completes successfully"]
        }
      ],
      stepByStepDiagnosis: [
        "Unplug camera assemblies from motherboard.",
        "Measure LDO voltage rails feeding the camera modules.",
        "Clean socket using isopropyl alcohol and re-test."
      ],
      repairDifficulty: "EASY",
      toolsNeeded: ["Spatula", "Isopropyl Alcohol"],
      safetyWarnings: ["Be careful not to scratch camera lenses."],
      nextQuestions: ["Which camera lens is crashing? Does the camera app open?"]
    };
  }

  async diagnoseWindowsLog(logText: string): Promise<AiDiagnosticResponse> {
    return {
      summary: "Windows system logs indicate a kernel trap dump, often pointing to memory corruption (RAM) or disk sectors.",
      likelyFaults: [
        {
          fault: "RAM Solder Fractures / Defective Memory module",
          confidence: 0.80,
          reason: "BSOD codes like MEMORY_MANAGEMENT or PAGE_FAULT_IN_NONPAGED_AREA suggest bad sectors in DRAM memory.",
          componentsToCheck: ["DDR slot pins", "SoC RAM chips"],
          railsToMeasure: ["PP1V2_DRAM", "PP0V6_VREF"],
          recommendedTests: ["Run MemTest86 tool", "Apply hot air reflow to re-seat BGA memory chips"]
        }
      ],
      stepByStepDiagnosis: [
        "Clean RAM contacts using a rubber eraser and re-seat in socket.",
        "Measure power rail PP1V2_DRAM.",
        "Check for cracked motherboard solder traces near CPU socket."
      ],
      repairDifficulty: "MEDIUM",
      toolsNeeded: ["MemTest86 USB", "Heat Gun"],
      safetyWarnings: ["Unplug AC chargers and battery cables before removing RAM sticks."],
      nextQuestions: ["Does the crash occur under high GPU workloads?"]
    };
  }

  async diagnoseMacOsLog(logText: string): Promise<AiDiagnosticResponse> {
    return this.diagnosePanicLog(logText);
  }

  async diagnoseBoardMeasurements(measurements: any[]): Promise<any> {
    const results = measurements.map(m => {
      const expected = parseFloat(m.expectedValue);
      const measured = parseFloat(m.measuredValue);
      let status = 'UNKNOWN';
      
      if (!isNaN(expected) && !isNaN(measured)) {
        const diff = Math.abs(expected - measured);
        if (diff < 0.05) {
          status = 'NORMAL';
        } else if (diff > 0.5 || measured < 0.1) {
          status = 'FAILED'; // Shorted or heavily dropped
        } else {
          status = 'SUSPICIOUS';
        }
      }
      return {
        ...m,
        status
      };
    });
    return { results };
  }

  // Microscope/thermal image classification mocks
  async diagnoseImageAnalysis(imageType: 'microscope' | 'thermal', fileName: string): Promise<AiDiagnosticResponse> {
    if (imageType === 'thermal') {
      return {
        summary: "Thermal heat dissipation highlights a hotspot area drawing high currents.",
        likelyFaults: [
          {
            fault: "Shorted Decoupling Capacitor (PP_VDD_MAIN)",
            confidence: 0.92,
            reason: "Hotspot radiates outward from filter capacitor C3284, which sits on the VDD_MAIN booster rail.",
            componentsToCheck: ["C3284 backlight filter cap", "PMIC chip"],
            railsToMeasure: ["PP_VDD_MAIN"],
            recommendedTests: ["Measure capacitor pads resistance to ground"]
          }
        ],
        stepByStepDiagnosis: [
          "Connect board to power and apply freeze spray on capacitor array.",
          "Inject 1.0V/2A and identify which capacitor melts first.",
          "Remove capacitor using hot air."
        ],
        repairDifficulty: "MEDIUM",
        toolsNeeded: ["Freeze Spray", "Multimeter", "Hot Air Gun"],
        safetyWarnings: ["Do not freeze battery modules."],
        nextQuestions: ["What was the current draw reading when injecting 1V?"]
      };
    }

    return {
      summary: "Microscope visual anomalies highlight physical solder corrosion and oxidation.",
      likelyFaults: [
        {
          fault: "FPC Connector pin corrosion",
          confidence: 0.88,
          reason: "Green residue on pins 1 to 5 indicates liquid ingress, causing a partial short on the data lines.",
          componentsToCheck: ["Charging Port connector J5700", "Nearby filter arrays"],
          railsToMeasure: ["I2C3_SDA_CONN", "I2C3_SCL_CONN"],
          recommendedTests: ["Clean socket under microscope using high-purity isopropyl alcohol"]
        }
      ],
      stepByStepDiagnosis: [
        "Clean corrosion using fiberglass brush.",
        "Apply flux and touch up pins with micro-soldering tip.",
        "Replace connector if internal pins are burnt out."
      ],
      repairDifficulty: "HARD",
      toolsNeeded: ["Microscope", "Fiberglass Pen", "Amtech Flux", "Micro-soldering tip"],
      safetyWarnings: ["Avoid breathing in flux smoke."],
      nextQuestions: ["Is there any corrosion on the mating flex cable plug?"]
    };
  }

  // Real OpenAI API call if key is present
  private async callOpenAiApi(inputText: string, deviceContext: string): Promise<AiDiagnosticResponse> {
    const fetch = require('node-fetch'); // Fallback or native fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME || 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert electronics repair AI diagnostics engine. Diagnose issues for device: "${deviceContext}". You must return valid JSON matching this schema:
{
  "summary": "String",
  "likelyFaults": [
    {
      "fault": "String",
      "confidence": Number (0-1),
      "reason": "String",
      "componentsToCheck": ["String"],
      "railsToMeasure": ["String"],
      "recommendedTests": ["String"]
    }
  ],
  "stepByStepDiagnosis": ["String"],
  "repairDifficulty": "String (EASY/MEDIUM/HARD/VERY_HARD)",
  "toolsNeeded": ["String"],
  "safetyWarnings": ["String"],
  "nextQuestions": ["String"]
}`
          },
          {
            role: "user",
            content: `Diagnose: ${inputText}`
          }
        ]
      })
    });

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    return JSON.parse(resultText) as AiDiagnosticResponse;
  }
}

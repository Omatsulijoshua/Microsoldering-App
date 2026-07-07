import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export interface UsbDeviceDetails {
  connected: boolean;
  brand: string;
  model: string;
  serialNumber: string;
  osVersion: string;
  bootMode: "Normal" | "Recovery" | "DFU" | "Fastboot" | "Download" | "Unknown";
  batteryHealth?: string;
  chargeCycles?: number;
  rawDetails: string;
  warning?: string;
}

export async function detectUsbDevice(): Promise<UsbDeviceDetails> {
  try {
    // 1. Try to detect iOS device using libimobiledevice (ideviceinfo)
    const iosDetails = await scanIosDevice();
    if (iosDetails.connected) {
      return iosDetails;
    }
  } catch (err) {
    // Gracefully continue to Android scanning if iOS command fails or is missing
  }

  try {
    // 2. Try to detect Android device using adb
    const androidDetails = await scanAndroidDevice();
    if (androidDetails.connected) {
      return androidDetails;
    }
  } catch (err) {
    // Gracefully continue
  }

  // 3. Fallback: Return simulated/mock device list if no hardware tool responds
  // This ensures the application remains fully interactive and testable on a development machine.
  return {
    connected: false,
    brand: "No USB Device Detected",
    model: "N/A",
    serialNumber: "N/A",
    osVersion: "N/A",
    bootMode: "Unknown",
    rawDetails: "USB scanning active. Install 'adb' for Android support or 'libimobiledevice' for iPhone support.",
    warning: "Connect a mobile device via USB and ensure drivers are installed."
  };
}

async function scanIosDevice(): Promise<UsbDeviceDetails> {
  try {
    // Execute ideviceinfo from libimobiledevice package
    const { stdout } = await execPromise("ideviceinfo -s");
    
    // Parse key-value outputs
    const lines = stdout.split("\n");
    const infoMap: Record<string, string> = {};
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        const val = line.substring(idx + 1).trim();
        infoMap[key] = val;
      }
    }

    const model = infoMap["ProductType"] || infoMap["HardwareModel"] || "Unknown iPhone";
    const serial = infoMap["SerialNumber"] || infoMap["UniqueDeviceID"] || "Unknown Serial";
    const osVer = infoMap["ProductVersion"] || "Unknown iOS";
    
    return {
      connected: true,
      brand: "Apple",
      model: mapProductTypeToName(model),
      serialNumber: serial,
      osVersion: osVer,
      bootMode: "Normal",
      chargeCycles: infoMap["BatteryCycleCount"] ? parseInt(infoMap["BatteryCycleCount"]) : undefined,
      batteryHealth: infoMap["BatteryCurrentCapacity"] ? `${infoMap["BatteryCurrentCapacity"]}%` : undefined,
      rawDetails: stdout
    };
  } catch (err: any) {
    // If command is missing or errors out, see if we can check dfu/recovery list
    try {
      const { stdout: recoveryOut } = await execPromise("idevicerestore -l");
      if (recoveryOut.toLowerCase().includes("recovery") || recoveryOut.toLowerCase().includes("dfu")) {
        return {
          connected: true,
          brand: "Apple",
          model: "Apple Device",
          serialNumber: "Unknown (DFU/Recovery)",
          osVersion: "N/A",
          bootMode: recoveryOut.toLowerCase().includes("dfu") ? "DFU" : "Recovery",
          rawDetails: recoveryOut,
          warning: "Device is in Recovery/DFU state. Diagnostic access is restricted."
        };
      }
    } catch (e) {}

    return {
      connected: false,
      brand: "Apple",
      model: "",
      serialNumber: "",
      osVersion: "",
      bootMode: "Unknown",
      rawDetails: ""
    };
  }
}

async function scanAndroidDevice(): Promise<UsbDeviceDetails> {
  try {
    // Execute adb devices
    const { stdout: devicesOut } = await execPromise("adb devices");
    const lines = devicesOut.trim().split("\n");
    
    // Line 0 is "List of devices attached"
    if (lines.length <= 1 || lines[1].trim() === "") {
      // Check fastboot
      try {
        const { stdout: fastbootOut } = await execPromise("fastboot devices");
        if (fastbootOut.trim() !== "") {
          const parts = fastbootOut.split("\t");
          return {
            connected: true,
            brand: "Android (Fastboot)",
            model: "Fastboot Mode",
            serialNumber: parts[0] || "Unknown Serial",
            osVersion: "N/A",
            bootMode: "Fastboot",
            rawDetails: fastbootOut
          };
        }
      } catch (e) {}

      return {
        connected: false,
        brand: "Android",
        model: "",
        serialNumber: "",
        osVersion: "",
        bootMode: "Unknown",
        rawDetails: ""
      };
    }

    // Device detected
    const firstDeviceLine = lines[1];
    const [serial, state] = firstDeviceLine.split(/\s+/);
    
    if (state === "device") {
      // Query device characteristics using adb shell getprop
      const { stdout: brand } = await execPromise(`adb -s ${serial} shell getprop ro.product.brand`);
      const { stdout: model } = await execPromise(`adb -s ${serial} shell getprop ro.product.model`);
      const { stdout: osVer } = await execPromise(`adb -s ${serial} shell getprop ro.build.version.release`);
      
      // Query battery level
      let battery = "Unknown";
      try {
        const { stdout: batOut } = await execPromise(`adb -s ${serial} shell dumpsys battery`);
        const batMatch = batOut.match(/level:\s*(\d+)/);
        if (batMatch) {
          battery = `${batMatch[1]}%`;
        }
      } catch (e) {}

      return {
        connected: true,
        brand: brand.trim() || "Android",
        model: model.trim() || "Generic Device",
        serialNumber: serial,
        osVersion: osVer.trim() || "Unknown Android",
        bootMode: "Normal",
        batteryHealth: battery,
        rawDetails: `Serial: ${serial}\nStatus: Online\nState: Authorized`
      };
    } else if (state === "unauthorized") {
      return {
        connected: true,
        brand: "Android",
        model: "Unauthorized Device",
        serialNumber: serial,
        osVersion: "Unknown",
        bootMode: "Normal",
        rawDetails: "Device connected but USB debugging authorization prompt was not accepted on target screen.",
        warning: "Please unlock your phone and tap 'Allow USB debugging'."
      };
    } else {
      return {
        connected: true,
        brand: "Android",
        model: "Unknown (Bootloader/Recovery)",
        serialNumber: serial,
        osVersion: "N/A",
        bootMode: state === "recovery" ? "Recovery" : "Unknown",
        rawDetails: `Device connected in state: ${state}`
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      brand: "Android",
      model: "",
      serialNumber: "",
      osVersion: "",
      bootMode: "Unknown",
      rawDetails: ""
    };
  }
}

// Map Apple ProductType strings (like "iPhone13,4") to marketing names (like "iPhone 12 Pro Max")
function mapProductTypeToName(productType: string): string {
  const mapping: Record<string, string> = {
    // iPhone 11 series
    "iPhone12,1": "iPhone 11",
    "iPhone12,3": "iPhone 11 Pro",
    "iPhone12,5": "iPhone 11 Pro Max",
    // iPhone SE 2nd Gen
    "iPhone12,8": "iPhone SE (2nd Gen)",
    // iPhone 12 series
    "iPhone13,1": "iPhone 12 mini",
    "iPhone13,2": "iPhone 12",
    "iPhone13,3": "iPhone 12 Pro",
    "iPhone13,4": "iPhone 12 Pro Max",
    // iPhone 13 series
    "iPhone14,2": "iPhone 13 Pro",
    "iPhone14,3": "iPhone 13 Pro Max",
    "iPhone14,4": "iPhone 13 mini",
    "iPhone14,5": "iPhone 13",
    // iPhone SE 3rd Gen
    "iPhone14,6": "iPhone SE (3rd Gen)",
    // iPhone 14 series
    "iPhone14,7": "iPhone 14",
    "iPhone14,8": "iPhone 14 Plus",
    "iPhone15,2": "iPhone 14 Pro",
    "iPhone15,3": "iPhone 14 Pro Max",
    // iPhone 15 series
    "iPhone15,4": "iPhone 15",
    "iPhone15,5": "iPhone 15 Plus",
    "iPhone16,1": "iPhone 15 Pro",
    "iPhone16,2": "iPhone 15 Pro Max"
  };

  return mapping[productType] || productType;
}

// Generate high-quality mock device payloads for emulator mode in frontend
export function getSimulatedDevices(): UsbDeviceDetails[] {
  return [
    {
      connected: true,
      brand: "Apple",
      model: "iPhone 12 Pro",
      serialNumber: "G0NDX84NJ0D4",
      osVersion: "17.4.1",
      bootMode: "Normal",
      chargeCycles: 452,
      batteryHealth: "84%",
      rawDetails: "DeviceID: 00008101-000E09980189001E\nHardwareModel: iPhone13,3\nActivationState: Activated\nTimeIntervalSince1970: 178049382\nCPUArchitecture: arm64e"
    },
    {
      connected: true,
      brand: "Samsung",
      model: "Galaxy S21 Ultra",
      serialNumber: "R58R31X84YZ",
      osVersion: "14 (OneUI 6.0)",
      bootMode: "Normal",
      batteryHealth: "91%",
      rawDetails: "ro.product.brand: samsung\nro.product.model: SM-G998B\nro.build.version.release: 14\nro.boot.serialno: R58R31X84YZ\nsystem.usb.state: adb"
    },
    {
      connected: true,
      brand: "Sony",
      model: "PlayStation 5",
      serialNumber: "02-27453849-PS5",
      osVersion: "Firmware 8.40",
      bootMode: "Recovery",
      rawDetails: "Boot Status: Safe Mode (Option 7)\nHDMI Controller: MN864739 (Checked)\nUART Output: OK\nSMC: Active"
    },
    {
      connected: true,
      brand: "Nintendo",
      model: "Switch OLED",
      serialNumber: "XTW102948301",
      osVersion: "Horizon OS 17.0.1",
      bootMode: "Normal",
      chargeCycles: 184,
      batteryHealth: "96%",
      rawDetails: "APU: Tegra X1 (T210B01)\nEMMC Brand: Samsung\nFuel Gauge: MAX17050"
    }
  ];
}

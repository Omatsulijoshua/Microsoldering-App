# Microsolder AI Repair Reference Cheatsheet

This reference sheet compiles critical hardware telemetry, sensor behaviors, and rail specifications for electronic repair engineers.

---

## 1. iOS Watchdog Sensor Mapping

When an iPhone watchdog registers a failure to communicate with a sensor on the I2C/I3C/SMC bus, it triggers a kernel panic and reboot exactly every **180 seconds** (3 minutes).

| Sensor Code | System Description | Location / Cable | Common Causes of Failure |
| :--- | :--- | :--- | :--- |
| **`prs0`** | Barometric Pressure Sensor | Charging Port Flex | Torn flex during repair, liquid entry in charging jack, low-quality aftermarket flex. |
| **`mic1`** | Primary Main Microphone | Charging Port Flex | Dust clogging, liquid corrosion on charging port contacts, cracked solder joints. |
| **`mic2`** | Top/Rear Noise Mic | Power/Volume Flex | Damage during screen lift, volume key tears, liquid contact near flash module. |
| **`tg0b`** | Battery Thermal Thermistor | Battery BMS Board | Bent battery middle connector pins, missing ESD components around battery socket. |
| **`ans2`** | NAND Storage Subsystem | Motherboard (Logic Board) | Solder ball fracturing beneath NAND chip due to drops, blown NAND power rails. |

---

## 2. Critical Power Rails

Expected DC voltage levels on common electronics motherboards. Check these prior to boot cycle logic.

### A. Apple iPhone / iPad
- **`PP_BATT_VCC`**: 3.7V - 4.3V (Direct Battery Voltage).
- **`PP_VDD_MAIN`**: 3.8V - 4.4V (Primary System Bus). Short on this line kills the device completely.
- **`PP1V8_ALWAYS`**: 1.8V (Always-on line powering PMIC handshake and buttons).
- **`PP0V9_NAND`**: 0.9V (Low-voltage core for storage flash).

### B. Apple MacBook (USB-C Power Delivery)
- **`PP3V3_G3H`**: 3.3V (Always-on power rail required for USB-C negotiation controller).
- **`PPBUS_G3H`**: 12.0V - 13.1V (Main system rail). If shorted, charger is stuck drawing 5V.
- **`PPVCC_S0_CPU`**: 0.7V - 1.2V (Core CPU voltage).

---

## 3. Diode Mode Troubleshooting Guidelines

Diode mode measurements identify short circuits, broken signal traces, or blown IC internal logic gates. 

*Always measure with the motherboard completely powered down (battery and chargers disconnected), with your Red Multimeter Probe on Ground, and Black Probe touching the test point.*

### Typical Ranges:
- **`0.300V - 0.600V`**: Normal signal line / IC communication channel (I2C, SPI).
- **`0.100V - 0.250V`**: High-current core rails (CPU / GPU core). Low readings are normal here.
- **`OL` (Open Loop)**: Broken trace, blown series filter, or missing pull-up resistor.
- **`0.000V - 0.010V`**: Short circuit to ground. Trace components on this line.

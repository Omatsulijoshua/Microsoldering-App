import { parsePanicLog } from "../src/services/panicParser";

const mockLogs = {
  prs0: `{"bug_type":"210","timestamp":"2026-07-06 14:05:00.00 +0100","os_version":"iPhone OS 17.4.1 (21E236)","incident_id":"ABC123XYZ"}
panic(cpu 0 caller 0xfffffff02bb4b2ac): "Missing sensor(s): prs0\\n" @Watchdog.cpp:180
Debugger message: syslog saved
Memory status: ...`,
  
  mic2: `panic(cpu 1 caller 0xfffffff0111bc32b): "Missing sensor(s): mic2\\n"
Backtrace:
0xfffffff01334c000 ...`,
  
  ans2: `panic(cpu 0 caller 0xfffffff03bb2a11b): "ans2: NAND Write Error: block 4028, status 0xe00002eb\\n"
SMC Panic Assert: NAND flash failed to respond.`,
  
  general: `panic(cpu 0 caller 0xfffffff02bb2cb2a): "SMC Fatal Error: cpu watchdog timeout occurred"
Debugger message: syslog saved`
};

function runTests() {
  console.log("=== RUNNING PANIC LOG PARSER TESTS ===");

  // Test 1: prs0 (Charging Port Barometer)
  console.log("\nTesting prs0 panic log...");
  const res1 = parsePanicLog(mockLogs.prs0);
  console.log(`Detected Sensor: ${res1.parsedSensor}`);
  console.log(`Suspected Fault: ${res1.suspectedFault}`);
  console.log(`Confidence: ${res1.confidence * 100}%`);
  console.log(`Rails: ${res1.relatedRails.join(", ")}`);
  if (res1.parsedSensor !== "prs0") throw new Error("prs0 not detected!");

  // Test 2: mic2 (Power Button Mic)
  console.log("\nTesting mic2 panic log...");
  const res2 = parsePanicLog(mockLogs.mic2);
  console.log(`Detected Sensor: ${res2.parsedSensor}`);
  console.log(`Suspected Fault: ${res2.suspectedFault}`);
  if (res2.parsedSensor !== "mic2") throw new Error("mic2 not detected!");

  // Test 3: ans2 (NAND Storage)
  console.log("\nTesting ans2 (NAND) panic log...");
  const res3 = parsePanicLog(mockLogs.ans2);
  console.log(`Detected Sensor: ${res3.parsedSensor}`);
  console.log(`Suspected Fault: ${res3.suspectedFault}`);
  if (res3.parsedSensor !== "ans2") throw new Error("ans2 NAND fault not detected!");

  // Test 4: General watchdog panic
  console.log("\nTesting general panic log...");
  const res4 = parsePanicLog(mockLogs.general);
  console.log(`Detected Sensor: ${res4.parsedSensor}`);
  console.log(`Suspected Fault: ${res4.suspectedFault}`);
  if (res4.parsedSensor !== "general_panic") throw new Error("general_panic fallback failed!");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

runTests();

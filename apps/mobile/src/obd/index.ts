import { Elm327 } from "./elm327";
import { MockTransport } from "./transport";

export type AdapterMode = "demo" | "bluetooth";

/** Build an ELM327 driver over the chosen transport. "demo" needs no hardware; "bluetooth" needs an adapter. */
export async function createElm327(mode: AdapterMode): Promise<Elm327> {
  if (mode === "bluetooth") {
    // Lazy-load so the native BLE module is only required when Bluetooth is actually used — this
    // keeps the demo path working in Expo Go, which has no BLE native module.
    const { BleTransport } = await import("./ble-transport");
    return new Elm327(new BleTransport());
  }
  return new Elm327(new MockTransport());
}

export { Elm327 } from "./elm327";
export type { ObdTransport } from "./transport";

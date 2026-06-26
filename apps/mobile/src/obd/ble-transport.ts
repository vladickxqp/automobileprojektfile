import { BleManager, type Device } from "react-native-ble-plx";
import { decode, encode } from "base-64";
import type { ObdTransport } from "./transport";

// Common ELM327 BLE UUIDs. Some clones expose FFE0/FFE1 instead — make these adapter-configurable
// when testing against real hardware.
const SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const WRITE_UUID = "0000fff2-0000-1000-8000-00805f9b34fb";
const NOTIFY_UUID = "0000fff1-0000-1000-8000-00805f9b34fb";

/**
 * Real Bluetooth transport for BLE ELM327 adapters (the iOS-compatible kind).
 *
 * TODO(on-device): request runtime BLE permissions (Android BLUETOOTH_SCAN/CONNECT + location)
 * before connect(), and confirm the service/characteristic UUIDs for the target adapter. This
 * layer can only be fully exercised on a physical device with an adapter.
 */
export class BleTransport implements ObdTransport {
  readonly label = "Bluetooth (ELM327)";
  private readonly manager = new BleManager();
  private device: Device | null = null;

  async connect(): Promise<void> {
    const found = await this.scanForAdapter();
    const connected = await found.connect();
    this.device = await connected.discoverAllServicesAndCharacteristics();
  }

  async send(command: string): Promise<string> {
    const device = this.device;
    if (!device) throw new Error("Not connected");

    return new Promise<string>((resolve, reject) => {
      let buffer = "";
      const sub = device.monitorCharacteristicForService(SERVICE_UUID, NOTIFY_UUID, (error, char) => {
        if (error) {
          cleanup();
          reject(error);
          return;
        }
        const value = char?.value;
        if (!value) return;
        buffer += decode(value);
        if (buffer.includes(">")) {
          cleanup();
          resolve(buffer);
        }
      });
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("OBD response timeout"));
      }, 6000);

      function cleanup() {
        clearTimeout(timer);
        sub.remove();
      }

      device
        .writeCharacteristicWithResponseForService(SERVICE_UUID, WRITE_UUID, encode(`${command}\r`))
        .catch((err: unknown) => {
          cleanup();
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
  }

  private scanForAdapter(): Promise<Device> {
    return new Promise<Device>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.manager.stopDeviceScan();
        reject(new Error("No ELM327 adapter found"));
      }, 10000);

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          clearTimeout(timer);
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }
        const name = device?.name ?? device?.localName ?? "";
        if (device && /elm327|obd|vgate|viecar|konnwei/i.test(name)) {
          clearTimeout(timer);
          this.manager.stopDeviceScan();
          resolve(device);
        }
      });
    });
  }
}

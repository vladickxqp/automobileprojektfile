// Transport is the lowest layer of the OBD stack: it moves command/response text to and from an
// ELM327 adapter. Swapping implementations (mock vs BLE) keeps the protocol code hardware-agnostic.
export interface ObdTransport {
  readonly label: string;
  connect(): Promise<void>;
  /** Send a command (e.g. "ATZ", "03") and resolve with the adapter's text response. */
  send(command: string): Promise<string>;
  disconnect(): Promise<void>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulated ELM327 for development and demos — NO hardware required. This is clearly a dev aid,
 * not a real adapter: scans produced here are explicitly tagged so they aren't mistaken for real
 * readings. Real readings come through BleTransport.
 */
export class MockTransport implements ObdTransport {
  readonly label = "Demo adapter (simulated)";
  private connected = false;

  async connect(): Promise<void> {
    await delay(300);
    this.connected = true;
  }

  async send(command: string): Promise<string> {
    if (!this.connected) throw new Error("Not connected");
    await delay(120);
    const cmd = command.trim().toUpperCase();
    if (cmd.startsWith("AT")) return "OK\r>";
    if (cmd === "03") return "43 04 01 04 20 00 00\r>"; // P0401 + P0420
    return "NO DATA\r>";
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

import { parseMode03Response } from "@autolife/shared";
import type { ObdTransport } from "./transport";

/** Drives an ELM327 over any transport: runs the init handshake, then reads stored DTCs (mode 03). */
export class Elm327 {
  constructor(private readonly transport: ObdTransport) {}

  get label(): string {
    return this.transport.label;
  }

  async connect(): Promise<void> {
    await this.transport.connect();
    await this.transport.send("ATZ"); // reset
    await this.transport.send("ATE0"); // echo off
    await this.transport.send("ATL0"); // linefeeds off
    await this.transport.send("ATSP0"); // auto-detect protocol
  }

  /** Read stored Diagnostic Trouble Codes (OBD-II mode 03). */
  async readDtcs(): Promise<string[]> {
    const raw = await this.transport.send("03");
    return parseMode03Response(raw);
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
  }
}

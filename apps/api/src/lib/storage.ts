import { mkdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageService {
  /** Persists bytes under `key` and returns a public-relative URL (e.g. /files/<key>). */
  save(key: string, data: Buffer): Promise<string>;
}

/**
 * Local-disk storage for development. Production swaps in an S3/R2 implementation behind this same
 * interface and serves via signed URLs instead of the static /files route.
 */
export class LocalStorage implements StorageService {
  constructor(private readonly root: string) {}

  async save(key: string, data: Buffer): Promise<string> {
    const dest = path.join(this.root, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, data);
    const urlPath = key.split(path.sep).join("/");
    return `/files/${urlPath}`;
  }
}

export const STORAGE_ROOT = path.resolve(process.cwd(), "storage");
mkdirSync(STORAGE_ROOT, { recursive: true });

export const storage: StorageService = new LocalStorage(STORAGE_ROOT);

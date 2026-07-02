import { mkdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";

export interface StorageService {
  /** Persists bytes under `key` and returns a public-relative URL (e.g. /files/<key>). */
  save(key: string, data: Buffer): Promise<string>;
}

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};
const contentTypeFor = (key: string) => CONTENT_TYPES[path.extname(key).toLowerCase()] ?? "application/octet-stream";

/**
 * Supabase Storage backend. Uploads via the Storage REST API using the service-role key (bypasses
 * RLS) and returns a permanent public URL. The bucket is created (public) on first use.
 */
export class SupabaseStorage implements StorageService {
  private bucketReady: Promise<void> | null = null;

  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
    private readonly bucket: string,
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { apikey: this.serviceKey, Authorization: `Bearer ${this.serviceKey}`, ...extra };
  }

  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const res = await fetch(`${this.url}/storage/v1/bucket`, {
          method: "POST",
          headers: this.headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: this.bucket, name: this.bucket, public: true }),
        });
        // 200 = created, 409 = already exists — both fine.
        if (!res.ok && res.status !== 409) {
          this.bucketReady = null; // allow a retry on the next upload
          throw new Error(`Supabase bucket setup failed (${res.status}): ${await res.text()}`);
        }
      })();
    }
    return this.bucketReady;
  }

  async save(key: string, data: Buffer): Promise<string> {
    await this.ensureBucket();
    const objectPath = key.split(path.sep).join("/");
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${objectPath}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": contentTypeFor(objectPath), "x-upsert": "true" }),
      body: data,
    });
    if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
    return `${this.url}/storage/v1/object/public/${this.bucket}/${objectPath}`;
  }
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

// Prefer Supabase Storage when configured (persistent, public URLs); else local disk (dev / until
// the Supabase env vars are set on the server).
export const storage: StorageService =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? new SupabaseStorage(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_BUCKET)
    : new LocalStorage(STORAGE_ROOT);

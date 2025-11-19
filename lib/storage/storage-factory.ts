import type { IStorageAdapter, UploadOptions, UploadResult, ListOptions, ListResult } from "./storage-interface";
import { VercelBlobAdapter } from "./vercel-blob-adapter";
import { S3Adapter } from "./s3-adapter";

/**
 * Storage Factory
 * Returns the appropriate storage adapter based on configuration
 */

let cachedAdapter: IStorageAdapter | null = null;

/**
 * Auto Storage Adapter with Fallback
 * Tries primary storage first, falls back to secondary if primary fails
 */
class AutoStorageAdapter implements IStorageAdapter {
  private primary: IStorageAdapter;
  private fallback: IStorageAdapter;

  constructor(primary: IStorageAdapter, fallback: IStorageAdapter) {
    this.primary = primary;
    this.fallback = fallback;
    console.log(
      `[AUTO-STORAGE] Primary: ${primary.getProviderName()}, Fallback: ${fallback.getProviderName()}`,
    );
  }

  async upload(
    path: string,
    buffer: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      return await this.primary.upload(path, buffer, options);
    } catch (primaryError) {
      console.warn(
        `[AUTO-STORAGE] Primary storage failed, trying fallback...`,
        primaryError,
      );
      try {
        return await this.fallback.upload(path, buffer, options);
      } catch (fallbackError) {
        console.error(
          `[AUTO-STORAGE] Both storage providers failed!`,
          fallbackError,
        );
        throw fallbackError;
      }
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    try {
      return await this.primary.list(options);
    } catch (primaryError) {
      console.warn(
        `[AUTO-STORAGE] Primary storage list failed, trying fallback...`,
        primaryError,
      );
      try {
        return await this.fallback.list(options);
      } catch (fallbackError) {
        console.error(
          `[AUTO-STORAGE] Both storage providers failed for list!`,
          fallbackError,
        );
        throw fallbackError;
      }
    }
  }

  getPublicUrl(videoId: string): string {
    return this.primary.getPublicUrl(videoId);
  }

  getProviderName(): string {
    return `auto (${this.primary.getProviderName()} -> ${this.fallback.getProviderName()})`;
  }
}

/**
 * Get the configured storage adapter
 * @returns Storage adapter instance
 */
export function getStorageAdapter(): IStorageAdapter {
  // Return cached adapter if available (singleton pattern)
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const provider = process.env.STORAGE_PROVIDER || "auto";

  console.log(`[STORAGE-FACTORY] Initializing storage provider: ${provider}`);

  try {
    switch (provider.toLowerCase()) {
      case "vercel-blob":
      case "vercel":
        cachedAdapter = new VercelBlobAdapter();
        break;

      case "s3":
        cachedAdapter = new S3Adapter();
        break;

      case "auto": {
        // Auto-detect based on available credentials
        const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
        const hasS3 = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET);

        if (hasVercelBlob && hasS3) {
          // Both available: Vercel Blob primary, S3 fallback
          console.log(
            `[STORAGE-FACTORY] Auto mode: Both providers available, using Vercel Blob with S3 fallback`,
          );
          cachedAdapter = new AutoStorageAdapter(
            new VercelBlobAdapter(),
            new S3Adapter(),
          );
        } else if (hasS3) {
          // Only S3 available
          console.log(`[STORAGE-FACTORY] Auto mode: Only S3 configured`);
          cachedAdapter = new S3Adapter();
        } else if (hasVercelBlob) {
          // Only Vercel Blob available
          console.log(
            `[STORAGE-FACTORY] Auto mode: Only Vercel Blob configured`,
          );
          cachedAdapter = new VercelBlobAdapter();
        } else {
          // No storage configured, default to Vercel Blob (for backward compatibility)
          console.warn(
            `[STORAGE-FACTORY] Auto mode: No storage configured, defaulting to Vercel Blob`,
          );
          cachedAdapter = new VercelBlobAdapter();
        }
        break;
      }

      default:
        console.warn(
          `[STORAGE-FACTORY] Unknown provider "${provider}", falling back to auto mode`,
        );
        cachedAdapter = getStorageAdapter(); // Recursive call with auto mode
    }

    console.log(
      `[STORAGE-FACTORY] Using provider: ${cachedAdapter.getProviderName()}`,
    );

    return cachedAdapter;
  } catch (error) {
    console.error(`[STORAGE-FACTORY] Failed to initialize storage:`, error);
    // Last resort: try Vercel Blob
    console.log(`[STORAGE-FACTORY] Falling back to Vercel Blob as last resort`);
    cachedAdapter = new VercelBlobAdapter();
    return cachedAdapter;
  }
}

/**
 * Reset the cached adapter (useful for testing)
 */
export function resetStorageAdapter(): void {
  cachedAdapter = null;
}
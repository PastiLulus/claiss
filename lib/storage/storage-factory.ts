import type { IStorageAdapter } from "./storage-interface";
import { VercelBlobAdapter } from "./vercel-blob-adapter";

/**
 * Storage Factory
 * Returns the appropriate storage adapter based on configuration
 * Currently defaults to Vercel Blob for backward compatibility
 */

let cachedAdapter: IStorageAdapter | null = null;

/**
 * Get the configured storage adapter
 * @returns Storage adapter instance
 */
export function getStorageAdapter(): IStorageAdapter {
  // Return cached adapter if available (singleton pattern)
  if (cachedAdapter) {
    return cachedAdapter;
  }

  // For now, always return Vercel Blob adapter (Phase 1)
  // This will be extended in Phase 2 to support S3 and auto-selection
  const provider = process.env.STORAGE_PROVIDER || "vercel-blob";

  console.log(`[STORAGE-FACTORY] Initializing storage provider: ${provider}`);

  switch (provider.toLowerCase()) {
    case "vercel-blob":
    case "vercel":
      cachedAdapter = new VercelBlobAdapter();
      break;

    // Future providers will be added here
    // case "s3":
    //   cachedAdapter = new S3Adapter();
    //   break;
    // case "auto":
    //   cachedAdapter = new AutoStorageAdapter();
    //   break;

    default:
      console.warn(
        `[STORAGE-FACTORY] Unknown provider "${provider}", falling back to Vercel Blob`,
      );
      cachedAdapter = new VercelBlobAdapter();
  }

  console.log(
    `[STORAGE-FACTORY] Using provider: ${cachedAdapter.getProviderName()}`,
  );

  return cachedAdapter;
}

/**
 * Reset the cached adapter (useful for testing)
 */
export function resetStorageAdapter(): void {
  cachedAdapter = null;
}
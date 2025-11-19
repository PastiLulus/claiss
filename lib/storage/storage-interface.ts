/**
 * Storage Abstraction Layer Interface
 * Provides a unified interface for different storage providers (Vercel Blob, S3, etc.)
 */

export interface UploadOptions {
  access?: 'public' | 'private';
  contentType?: string;
  addRandomSuffix?: boolean;
}

export interface UploadResult {
  url: string;
  pathname: string;
  videoId: string;
}

export interface ListOptions {
  prefix?: string;
  limit?: number;
}

export interface StorageObject {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export interface ListResult {
  blobs: StorageObject[];
}

/**
 * Interface that all storage adapters must implement
 */
export interface IStorageAdapter {
  /**
   * Upload a file to storage
   * @param path - The path/key for the file
   * @param buffer - The file content as a Buffer
   * @param options - Upload options
   * @returns Upload result with URL and metadata
   */
  upload(
    path: string,
    buffer: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /**
   * List files in storage
   * @param options - List options including prefix and limit
   * @returns List of storage objects
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Get the public URL for a video
   * @param videoId - The video identifier
   * @returns Public URL to access the video
   */
  getPublicUrl(videoId: string): string;

  /**
   * Get the storage provider name
   * @returns Name of the storage provider
   */
  getProviderName(): string;
}
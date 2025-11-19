import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { generateSimpleVideoId } from "../simple-video-id";
import type {
  IStorageAdapter,
  UploadOptions,
  UploadResult,
  ListOptions,
  ListResult,
  StorageObject,
} from "./storage-interface";

/**
 * Retry configuration for S3 operations
 */
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with exponential backoff retry logic
 * @param operation - The async operation to execute
 * @param operationName - Name of the operation for logging
 * @param maxRetries - Maximum number of retries (default: 4)
 * @returns Result of the operation
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(
          `[S3-RETRY] ${operationName} - Attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms delay`,
        );
        await sleep(delay);
      }

      const result = await operation();

      if (attempt > 0) {
        console.log(
          `[S3-RETRY] ${operationName} - ✅ Succeeded on attempt ${attempt + 1}`,
        );
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[S3-RETRY] ${operationName} - ❌ Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        lastError.message,
      );

      // Don't sleep after the last attempt
      if (attempt === maxRetries) {
        console.error(
          `[S3-RETRY] ${operationName} - All ${maxRetries + 1} attempts failed`,
        );
        throw lastError;
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`${operationName} failed after all retries`);
}

/**
 * S3 Storage Adapter
 * Supports AWS S3 and S3-compatible services (DigitalOcean Spaces, Backblaze B2, etc.)
 */
export class S3Adapter implements IStorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicUrlBase?: string;
  private forcePathStyle: boolean;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET || "";
    this.publicUrlBase = process.env.S3_PUBLIC_URL_BASE;
    this.forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false"; // Default to true

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "S3 credentials not configured. Please set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables.",
      );
    }

    if (!this.bucket) {
      throw new Error(
        "S3 bucket not configured. Please set S3_BUCKET environment variable.",
      );
    }

    // Configure S3 client
    this.client = new S3Client({
      endpoint: endpoint || undefined, // Undefined for AWS S3, URL for S3-compatible services
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: this.forcePathStyle, // Required for most S3-compatible services
    });

    console.log(`[S3-ADAPTER] Initialized with bucket: ${this.bucket}`);
    console.log(`[S3-ADAPTER] Region: ${region}`);
    console.log(`[S3-ADAPTER] Endpoint: ${endpoint || "AWS S3 default"}`);
    console.log(`[S3-ADAPTER] Force path style: ${this.forcePathStyle}`);
  }

  async upload(
    path: string,
    buffer: Buffer,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    console.log(`[S3-ADAPTER] Uploading ${path} (${buffer.length} bytes)`);

    const key = path; // e.g., "videos/vid_123.mp4"
    const videoId = path.match(/videos\/([^.]+)/)?.[1] || generateSimpleVideoId();

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || "video/mp4",
      ACL: options.access === "public" ? "public-read" : undefined,
    };

    // Upload with retry logic
    await withRetry(
      async () => {
        const command = new PutObjectCommand(params);
        await this.client.send(command);
      },
      `Upload ${path}`,
    );

    // Generate public URL
    const url = this.getPublicUrl(videoId);

    console.log(`[S3-ADAPTER] ✅ Upload successful: ${url}`);

    return {
      url,
      pathname: key,
      videoId,
    };
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    console.log(
      `[S3-ADAPTER] Listing objects with prefix: ${options.prefix || "all"}`,
    );

    // List with retry logic
    const response = await withRetry(
      async () => {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: options.prefix,
          MaxKeys: options.limit || 1000,
        });
        return await this.client.send(command);
      },
      `List objects (prefix: ${options.prefix || "all"})`,
    );

    // Convert S3 format to our unified format
    const blobs: StorageObject[] = (response.Contents || []).map((obj) => {
      const pathname = obj.Key || "";
      const videoId = pathname.match(/videos\/([^.]+)/)?.[1] || "";
      
      return {
        url: this.buildObjectUrl(pathname),
        pathname,
        size: obj.Size || 0,
        uploadedAt: obj.LastModified || new Date(),
      };
    });

    console.log(`[S3-ADAPTER] ✅ Found ${blobs.length} objects`);

    return { blobs };
  }

  getPublicUrl(videoId: string): string {
    // If custom public URL base is provided, use it
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/videos/${videoId}.mp4`;
    }

    // Build URL from S3 configuration
    return this.buildObjectUrl(`videos/${videoId}.mp4`);
  }

  private buildObjectUrl(key: string): string {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "us-east-1";

    if (endpoint) {
      // S3-compatible service (e.g., DigitalOcean Spaces)
      if (this.forcePathStyle) {
        // Path-style: https://endpoint/bucket/key
        return `${endpoint}/${this.bucket}/${key}`;
      } else {
        // Virtual-hosted-style: https://bucket.endpoint/key
        const baseUrl = endpoint.replace("https://", "").replace("http://", "");
        return `https://${this.bucket}.${baseUrl}/${key}`;
      }
    } else {
      // AWS S3
      if (this.forcePathStyle) {
        // Path-style: https://s3.region.amazonaws.com/bucket/key
        return `https://s3.${region}.amazonaws.com/${this.bucket}/${key}`;
      } else {
        // Virtual-hosted-style: https://bucket.s3.region.amazonaws.com/key
        return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
      }
    }
  }

  getProviderName(): string {
    return "s3";
  }
}
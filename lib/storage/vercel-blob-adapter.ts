import { put, list as blobList } from "@vercel/blob";
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
 * Vercel Blob Storage Adapter
 * Wraps @vercel/blob operations to conform to IStorageAdapter interface
 */
export class VercelBlobAdapter implements IStorageAdapter {
  async upload(
    path: string,
    buffer: Buffer,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    try {
      console.log(
        `[VERCEL-BLOB-ADAPTER] Uploading ${path} (${buffer.length} bytes)`,
      );

      const blob = await put(path, buffer, {
        access: options.access || "public",
        contentType: options.contentType || "video/mp4",
        addRandomSuffix: options.addRandomSuffix,
      });

      // Extract videoId from the path (e.g., "videos/vid_123.mp4" -> "vid_123")
      const videoId = path.match(/videos\/([^.]+)/)?.[1] || generateSimpleVideoId();

      console.log(
        `[VERCEL-BLOB-ADAPTER] ✅ Upload successful: ${blob.url}`,
      );

      return {
        url: blob.url,
        pathname: blob.pathname,
        videoId,
      };
    } catch (error) {
      console.error(
        `[VERCEL-BLOB-ADAPTER] ❌ Upload failed:`,
        error,
      );
      throw error;
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    try {
      console.log(
        `[VERCEL-BLOB-ADAPTER] Listing blobs with prefix: ${options.prefix || "all"}`,
      );

      const result = await blobList({
        prefix: options.prefix,
        limit: options.limit,
      });

      // Convert Vercel Blob format to our unified format
      const blobs: StorageObject[] = result.blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt),
      }));

      console.log(
        `[VERCEL-BLOB-ADAPTER] ✅ Found ${blobs.length} blobs`,
      );

      return { blobs };
    } catch (error) {
      console.error(
        `[VERCEL-BLOB-ADAPTER] ❌ List failed:`,
        error,
      );
      throw error;
    }
  }

  getPublicUrl(videoId: string): string {
    // For Vercel Blob, we need to use the API route to retrieve the video
    // since we don't have the direct URL without listing
    return `/api/videos?id=${videoId}`;
  }

  getProviderName(): string {
    return "vercel-blob";
  }
}
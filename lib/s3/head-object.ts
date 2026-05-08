import { HeadObjectCommand, NotFound } from "@aws-sdk/client-s3";

import { type S3Client, s3 } from "./client";
import type { HeadObjectInput } from "./schemas";

export async function headObject(
  params: HeadObjectInput,
  client: S3Client = s3,
) {
  try {
    const response = await client.send(
      new HeadObjectCommand({ Bucket: params.bucket, Key: params.key }),
    );
    return {
      exists: true as const,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
    };
  } catch (error) {
    if (error instanceof NotFound) return { exists: false as const };
    // S3 returns 404 as a generic error in some SDK versions; check status too.
    if (
      typeof error === "object" &&
      error !== null &&
      "$metadata" in error &&
      (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode === 404
    ) {
      return { exists: false as const };
    }
    throw error;
  }
}

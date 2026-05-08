import { GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";

import { type S3Client, s3 } from "./client";
import type { GetObjectInput } from "./schemas";

export async function getObject(params: GetObjectInput, client: S3Client = s3) {
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: params.bucket, Key: params.key }),
    );
    if (!response.Body) {
      return { ok: false as const };
    }
    const body = Buffer.from(await response.Body.transformToByteArray());
    return {
      ok: true as const,
      body,
      contentType: response.ContentType,
      contentLength: response.ContentLength ?? body.byteLength,
      etag: response.ETag,
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return { ok: false as const };
    throw error;
  }
}

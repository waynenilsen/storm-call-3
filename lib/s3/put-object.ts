import { PutObjectCommand } from "@aws-sdk/client-s3";

import { type S3Client, s3 } from "./client";
import type { PutObjectInput } from "./schemas";

export async function putObject(params: PutObjectInput, client: S3Client = s3) {
  await client.send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl,
    }),
  );
  return { bucket: params.bucket, key: params.key };
}

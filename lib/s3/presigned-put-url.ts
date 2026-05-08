import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { type S3Client, s3 } from "./client";
import type { PresignedUrlInput } from "./schemas";

export async function presignedPutUrl(
  params: PresignedUrlInput,
  client: S3Client = s3,
) {
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
    }),
    { expiresIn: params.expiresInSeconds },
  );
  return { url, expiresInSeconds: params.expiresInSeconds };
}

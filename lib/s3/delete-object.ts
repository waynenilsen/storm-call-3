import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { type S3Client, s3 } from "./client";
import type { DeleteObjectInput } from "./schemas";

export async function deleteObject(
  params: DeleteObjectInput,
  client: S3Client = s3,
) {
  await client.send(
    new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key }),
  );
  return { ok: true as const };
}

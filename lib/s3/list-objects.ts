import { ListObjectsV2Command } from "@aws-sdk/client-s3";

import { type S3Client, s3 } from "./client";
import type { ListObjectsInput } from "./schemas";

export async function listObjects(
  params: ListObjectsInput,
  client: S3Client = s3,
) {
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: params.bucket,
      Prefix: params.prefix,
      MaxKeys: params.limit,
      ContinuationToken: params.continuationToken,
    }),
  );
  const objects = (response.Contents ?? []).map((entry) => ({
    key: entry.Key ?? "",
    size: entry.Size ?? 0,
    etag: entry.ETag,
    lastModified: entry.LastModified,
  }));
  return {
    objects,
    isTruncated: response.IsTruncated ?? false,
    nextContinuationToken: response.NextContinuationToken,
  };
}

import { createId } from "@paralleldrive/cuid2";

/**
 * Returns a unique S3 key prefix for a single test, so parallel tests do not
 * collide. Mirrors the no-teardown pattern used for DB fixtures: tests dangle
 * objects under a unique prefix and never delete them.
 */
export function makeS3KeyPrefix(label: string) {
  return `test/${label}/${createId()}`;
}

export function privateBucket() {
  const bucket = process.env.S3_PRIVATE_BUCKET;
  if (!bucket) throw new Error("S3_PRIVATE_BUCKET is not set");
  return bucket;
}

export function publicBucket() {
  const bucket = process.env.S3_PUBLIC_BUCKET;
  if (!bucket) throw new Error("S3_PUBLIC_BUCKET is not set");
  return bucket;
}

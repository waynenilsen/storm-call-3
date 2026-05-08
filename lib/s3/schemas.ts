import { z } from "zod";

export const s3BucketSchema = z
  .string()
  .trim()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, "invalid bucket name");

export const s3KeySchema = z.string().min(1).max(1024);

const bodySchema = z.union([
  z.instanceof(Uint8Array),
  z.instanceof(Buffer),
  z.string(),
]);

export const putObjectInputSchema = z.object({
  bucket: s3BucketSchema,
  key: s3KeySchema,
  body: bodySchema,
  contentType: z.string().min(1).max(255).optional(),
  cacheControl: z.string().min(1).max(255).optional(),
});
export type PutObjectInput = z.infer<typeof putObjectInputSchema>;

export const getObjectInputSchema = z.object({
  bucket: s3BucketSchema,
  key: s3KeySchema,
});
export type GetObjectInput = z.infer<typeof getObjectInputSchema>;

export const headObjectInputSchema = getObjectInputSchema;
export type HeadObjectInput = z.infer<typeof headObjectInputSchema>;

export const deleteObjectInputSchema = getObjectInputSchema;
export type DeleteObjectInput = z.infer<typeof deleteObjectInputSchema>;

export const listObjectsInputSchema = z.object({
  bucket: s3BucketSchema,
  prefix: z.string().max(1024).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  continuationToken: z.string().min(1).max(2048).optional(),
});
export type ListObjectsInput = z.infer<typeof listObjectsInputSchema>;

export const presignedUrlInputSchema = z.object({
  bucket: s3BucketSchema,
  key: s3KeySchema,
  expiresInSeconds: z
    .number()
    .int()
    .min(1)
    .max(7 * 24 * 60 * 60)
    .default(900),
  contentType: z.string().min(1).max(255).optional(),
});
export type PresignedUrlInput = z.infer<typeof presignedUrlInputSchema>;

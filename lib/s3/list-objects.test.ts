import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { listObjects } from "./list-objects";
import { putObject } from "./put-object";

describe("listObjects", () => {
  test("returns only the keys under the given prefix", async () => {
    const prefix = makeS3KeyPrefix("list-scoped");
    const keys = [
      `${prefix}/a-${createId()}.txt`,
      `${prefix}/b-${createId()}.txt`,
      `${prefix}/c-${createId()}.txt`,
    ];
    for (const key of keys) {
      await putObject({
        bucket: privateBucket(),
        key,
        body: Buffer.from(key),
      });
    }

    const result = await listObjects({
      bucket: privateBucket(),
      prefix,
      limit: 100,
    });
    const returnedKeys = result.objects.map((o) => o.key).sort();
    expect(returnedKeys).toEqual([...keys].sort());
    expect(result.isTruncated).toBe(false);
  });

  test("paginates with a continuation token when limit is smaller than result set", async () => {
    const prefix = makeS3KeyPrefix("list-paged");
    const keys = [
      `${prefix}/1-${createId()}`,
      `${prefix}/2-${createId()}`,
      `${prefix}/3-${createId()}`,
    ];
    for (const key of keys) {
      await putObject({
        bucket: privateBucket(),
        key,
        body: Buffer.from("x"),
      });
    }

    const page1 = await listObjects({
      bucket: privateBucket(),
      prefix,
      limit: 2,
    });
    expect(page1.objects.length).toBe(2);
    expect(page1.isTruncated).toBe(true);
    expect(page1.nextContinuationToken).toBeTruthy();

    const page2 = await listObjects({
      bucket: privateBucket(),
      prefix,
      limit: 2,
      continuationToken: page1.nextContinuationToken,
    });
    expect(page2.objects.length).toBe(1);
    expect(page2.isTruncated).toBe(false);

    const seen = [...page1.objects, ...page2.objects].map((o) => o.key).sort();
    expect(seen).toEqual([...keys].sort());
  });
});

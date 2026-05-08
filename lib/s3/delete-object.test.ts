import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { deleteObject } from "./delete-object";
import { headObject } from "./head-object";
import { putObject } from "./put-object";

describe("deleteObject", () => {
  test("removes an existing object", async () => {
    const key = `${makeS3KeyPrefix("del-hit")}/${createId()}.txt`;
    await putObject({
      bucket: privateBucket(),
      key,
      body: Buffer.from("to be deleted"),
    });

    const before = await headObject({ bucket: privateBucket(), key });
    expect(before.exists).toBe(true);

    const result = await deleteObject({ bucket: privateBucket(), key });
    expect(result.ok).toBe(true);

    const after = await headObject({ bucket: privateBucket(), key });
    expect(after.exists).toBe(false);
  });

  test("is idempotent for a missing key", async () => {
    const key = `${makeS3KeyPrefix("del-miss")}/missing-${createId()}`;
    const result = await deleteObject({ bucket: privateBucket(), key });
    expect(result.ok).toBe(true);
  });
});

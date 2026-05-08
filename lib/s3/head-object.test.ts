import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { headObject } from "./head-object";
import { putObject } from "./put-object";

describe("headObject", () => {
  test("returns exists:true with metadata for an existing key", async () => {
    const key = `${makeS3KeyPrefix("head-hit")}/${createId()}.txt`;
    const body = Buffer.from("metadata-check");
    await putObject({
      bucket: privateBucket(),
      key,
      body,
      contentType: "text/plain",
    });

    const result = await headObject({ bucket: privateBucket(), key });
    expect(result.exists).toBe(true);
    if (result.exists) {
      expect(result.contentType).toBe("text/plain");
      expect(result.contentLength).toBe(body.byteLength);
    }
  });

  test("returns exists:false for a missing key", async () => {
    const key = `${makeS3KeyPrefix("head-miss")}/missing-${createId()}`;
    const result = await headObject({ bucket: privateBucket(), key });
    expect(result.exists).toBe(false);
  });
});

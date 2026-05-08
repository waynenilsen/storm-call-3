import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { getObject } from "./get-object";
import { putObject } from "./put-object";

describe("getObject", () => {
  test("returns ok:true with the stored bytes", async () => {
    const key = `${makeS3KeyPrefix("get-hit")}/${createId()}.bin`;
    const body = Buffer.from([1, 2, 3, 4, 5]);
    await putObject({
      bucket: privateBucket(),
      key,
      body,
      contentType: "application/octet-stream",
    });

    const result = await getObject({ bucket: privateBucket(), key });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.from(result.body)).toEqual([1, 2, 3, 4, 5]);
      expect(result.contentType).toBe("application/octet-stream");
    }
  });

  test("returns ok:false when the key is missing", async () => {
    const key = `${makeS3KeyPrefix("get-miss")}/does-not-exist-${createId()}`;
    const result = await getObject({ bucket: privateBucket(), key });
    expect(result.ok).toBe(false);
  });
});

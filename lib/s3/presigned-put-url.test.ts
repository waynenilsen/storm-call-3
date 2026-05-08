import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { getObject } from "./get-object";
import { presignedPutUrl } from "./presigned-put-url";

describe("presignedPutUrl", () => {
  test("returns a URL that accepts an HTTP PUT and lands the bytes in the bucket", async () => {
    const key = `${makeS3KeyPrefix("presigned-put")}/${createId()}.txt`;
    const { url, expiresInSeconds } = await presignedPutUrl({
      bucket: privateBucket(),
      key,
      expiresInSeconds: 60,
    });
    expect(url).toContain(key);
    expect(expiresInSeconds).toBe(60);

    const body = `signed-${createId()}`;
    const response = await fetch(url, { method: "PUT", body });
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    const fetched = await getObject({ bucket: privateBucket(), key });
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.body.toString("utf8")).toBe(body);
    }
  });
});

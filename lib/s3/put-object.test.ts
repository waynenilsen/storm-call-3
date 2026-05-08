import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { getObject } from "./get-object";
import { putObject } from "./put-object";

describe("putObject", () => {
  test("uploads bytes that round-trip via getObject with the right content type", async () => {
    const key = `${makeS3KeyPrefix("put-rt")}/${createId()}.txt`;
    const body = Buffer.from(`hello-${createId()}`);
    const result = await putObject({
      bucket: privateBucket(),
      key,
      body,
      contentType: "text/plain",
    });

    expect(result.bucket).toBe(privateBucket());
    expect(result.key).toBe(key);

    const fetched = await getObject({ bucket: privateBucket(), key });
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.body.toString("utf8")).toBe(body.toString("utf8"));
      expect(fetched.contentType).toBe("text/plain");
      expect(fetched.contentLength).toBe(body.byteLength);
    }
  });

  test("supports a string body", async () => {
    const key = `${makeS3KeyPrefix("put-string")}/${createId()}.txt`;
    const body = `text-${createId()}`;
    await putObject({ bucket: privateBucket(), key, body });

    const fetched = await getObject({ bucket: privateBucket(), key });
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.body.toString("utf8")).toBe(body);
    }
  });
});

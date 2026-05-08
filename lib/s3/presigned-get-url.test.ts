import { describe, expect, test } from "bun:test";
import { createId } from "@paralleldrive/cuid2";

import { makeS3KeyPrefix, privateBucket } from "@/test/test-s3";

import { presignedGetUrl } from "./presigned-get-url";
import { putObject } from "./put-object";

describe("presignedGetUrl", () => {
  test("returns a URL that downloads the stored bytes via HTTP GET", async () => {
    const key = `${makeS3KeyPrefix("presigned-get")}/${createId()}.txt`;
    const body = `signed-get-${createId()}`;
    await putObject({
      bucket: privateBucket(),
      key,
      body: Buffer.from(body),
      contentType: "text/plain",
    });

    const { url, expiresInSeconds } = await presignedGetUrl({
      bucket: privateBucket(),
      key,
      expiresInSeconds: 120,
    });
    expect(url).toContain(key);
    expect(expiresInSeconds).toBe(120);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(body);
  });
});

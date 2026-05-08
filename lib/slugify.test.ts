import { describe, expect, test } from "bun:test";

import { slugify } from "./slugify";

describe("slugify", () => {
  test("lower-cases and replaces separators with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  Acme Industries LLC  ")).toBe("acme-industries-llc");
  });

  test("folds punctuation and underscores into hyphens", () => {
    expect(slugify("foo_bar.baz")).toBe("foo-bar-baz");
  });

  test("does not choke on empties-only input", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });
});

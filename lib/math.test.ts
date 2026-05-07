import { describe, expect, test } from "bun:test";
import { add } from "./math";

describe("add", () => {
  test("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  test("adds a negative number", () => {
    expect(add(5, -2)).toBe(3);
  });

  test("adds zeros", () => {
    expect(add(0, 0)).toBe(0);
  });
});

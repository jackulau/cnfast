import { describe, expect, it } from "vitest";
import { cn } from "../src/index.js";

describe("cn", () => {
  it("joins string arguments with a single space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values", () => {
    expect(cn("a", null, undefined, false, 0, "", "b")).toBe("a b");
  });

  it("keeps truthy numbers", () => {
    expect(cn("a", 1, "b")).toBe("a 1 b");
  });

  it("flattens nested arrays", () => {
    expect(cn("a", ["b", ["c", ["d"]]])).toBe("a b c d");
  });

  it("includes object keys whose values are truthy", () => {
    expect(cn({ a: true, b: false, c: 1, d: 0, e: "x" })).toBe("a c e");
  });

  it("supports conditional className patterns", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", { active: isActive, disabled: isDisabled })).toBe("btn active");
  });

  it("mixes strings, arrays, and objects", () => {
    expect(cn("a", ["b", { c: true, d: false }], "e")).toBe("a b c e");
  });

  it("returns an empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns an empty string when everything is falsy", () => {
    expect(cn(null, undefined, false, 0, "")).toBe("");
  });
});

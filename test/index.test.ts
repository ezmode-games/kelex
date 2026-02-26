import { describe, expect, it } from "vitest";

describe("kelex", () => {
  it("should export module", async () => {
    const module = await import("../src/index");
    expect(module).toBeDefined();
  });
});

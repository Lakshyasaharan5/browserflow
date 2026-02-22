import { describe, it, expect } from "vitest";
import { BrowserAgent } from "../src";

describe("BrowserAgent pipeline", () => {
  
  it("navigation flow", async () => {
    const agent = new BrowserAgent();

    await expect(
      agent.execute({
        userQuery: "navigation",
        url: "file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html",
        test: true
      })
    ).resolves.toContain("Lakshya");
  });

  it("search flow", async () => {
    const agent = new BrowserAgent();

    await expect(
      agent.execute({
        userQuery: "search",
        url: "file:///Users/lakshyasaharan/projects/stagehand-lite/examples/search-result/index.html",
        test: true
      })
    ).resolves.toContain("Playwright");
  });
});
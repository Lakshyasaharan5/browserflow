import { chromium } from "playwright";
import { RunConfig } from "./types";
import { LLMClient } from "./interfaces";
import { FakeAIClient } from "./llm/FakeAIClient";
import { OpenAIClient } from "./llm/OpenAIClient";
import { runAgent } from "./agent";

export class BrowserAgent {
  async execute({ userQuery, url, test }: RunConfig): Promise<string> {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const page = await browser.newPage();
    await page.goto(url);

    const llm: LLMClient = test ? new FakeAIClient() : new OpenAIClient();
    const result = await runAgent(page, userQuery, llm);

    await browser.close();
    return result;
  }
}

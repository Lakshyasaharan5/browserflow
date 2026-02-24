import { chromium } from "playwright";
import { RunConfig } from "./types";
import { LLMClient } from "./interfaces";
import { FakeAIClient } from "./llm/FakeAIClient";
import { OpenAIClient } from "./llm/OpenAIClient";
import { runAgent } from "./agent";
import { Logger } from "./logger";
import { AgentState } from "./interfaces";

export class BrowserAgent {
    async execute({ userQuery, url, test }: RunConfig): Promise<string> {
        const logger = new Logger();

        const browserLogger = logger.child("Browser");
        browserLogger.info("Launching browser");

        const browser = await chromium.launch({ headless: false, slowMo: 1000 });
        const page = await browser.newPage();

        browserLogger.info("Navigating to URL", url);
        await page.goto(url);

        const state: AgentState = {
            instructions: userQuery,
            page,
            xpathMap: new Map<number, string>(),
            needsDistillation: true,
            logger,
        };

        const llm: LLMClient = test ? new FakeAIClient(logger) : new OpenAIClient(logger);

        browserLogger.info("Starting agent run");
        const result = await runAgent(state, llm);
        browserLogger.info("Agent run completed");

        browserLogger.info("Closing browser");
        await browser.close();
        return result;
    }
}

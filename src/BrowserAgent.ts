import { chromium, Browser } from "playwright";
import { RunConfig } from "./types";
import { LLMClient } from "./interfaces";
import { FakeAIClient } from "./llm/FakeAIClient";
import { OpenAIClient } from "./llm/OpenAIClient";
import { runAgent } from "./agent";
import { Logger } from "./logger";
import { AgentState } from "./interfaces";
import { Cache } from "./cache";

export class BrowserAgent {
    async execute({ userQuery, url, test }: RunConfig): Promise<string> {
        const logger = new Logger();
        const browserLogger = logger.child("Browser");
        let browser: Browser | undefined;
        try {
            browserLogger.info("Launching browser");
            browser = await chromium.launch({ headless: false, slowMo: 1000 });
            const page = await browser.newPage();

            browserLogger.info("Navigating to URL", url);
            await page.goto(url);

            const cache = new Cache({
                instructions: userQuery,
                startUrl: url,
                logger,
            });

            const replayResult = await cache.tryReplay(page);
            if (replayResult) {
                return replayResult;
            }

            cache.beginRecording();

            const state: AgentState = {
                instructions: userQuery,
                startUrl: url,
                page,
                xpathMap: new Map<number, string>(),
                needsDistillation: true,
                logger,
                cache,
            };

            const llm: LLMClient = test ? new FakeAIClient(logger) : new OpenAIClient(logger);

            browserLogger.info("Starting agent run");
            const result = await runAgent(state, llm);
            browserLogger.info("Agent run completed");

            cache.endRecording();
            await cache.store(result);

            return result;
        } catch (error) {
            browserLogger.error("Error occurred", error);
            throw error;
        } finally {
            browserLogger.info("Closing browser");
            await browser?.close();
        }
    }
}

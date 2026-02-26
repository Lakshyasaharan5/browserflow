import { Page } from "playwright";
import { ToolSet } from "ai";
import { Logger } from "./logger";
import { Cache } from "./cache";

export interface AgentState {
    instructions: string;
    startUrl: string;
    page: Page;
    xpathMap: Map<number, string>;
    needsDistillation: boolean;
    latestAriaTree?: string;
    logger: Logger;
    cache: Cache;
}

export interface LLMRequest {
    systemPrompt: string;
    tools: ToolSet;
    maxSteps?: number;
}

export interface LLMResponse {
    text: string;
}

export interface LLMClient {
    generate: (request: LLMRequest) => Promise<LLMResponse>;
}

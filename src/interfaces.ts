import { Page } from "playwright";
import { ToolSet } from "ai";
import { Logger } from "./logger";

export interface AgentState {
    instructions: string;
    page: Page;
    xpathMap: Map<number, string>;
    logger: Logger;
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

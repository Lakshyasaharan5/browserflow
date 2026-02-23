import { Page } from "playwright";
import { ToolSet } from "ai";

export interface AgentState {
    page: Page;
    xpathMap: Map<number, string>;
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

import { createTools } from "./tools";
import { buildPrompt } from "./prompt";
import { LLMClient, AgentState } from "./interfaces";

export async function runAgent(state: AgentState, llm: LLMClient): Promise<string> {
    const agentLogger = state.logger.child("Agent");

    agentLogger.info("Creating tools");
    const tools = createTools(state);

    agentLogger.info("Building system prompt");
    const systemPrompt = buildPrompt(state.instructions, state.page.url());

    agentLogger.info("Calling LLM");
    const result = await llm.generate({ tools, systemPrompt });

    agentLogger.info("LLM finished");
    return result.text;
}

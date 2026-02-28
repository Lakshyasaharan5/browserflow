import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { LLMClient, LLMRequest, LLMResponse } from "../interfaces";
import dotenv from "dotenv";
import { Logger } from "../logger";

dotenv.config({ quiet: true });

export class OpenAIClient implements LLMClient {
    constructor(private readonly logger: Logger) {}

    async generate({ systemPrompt, tools }: LLMRequest): Promise<LLMResponse> {
        const openaiLogger = this.logger.child("OpenAI");

        openaiLogger.info("Starting generation");

        const openai = createOpenAI({
            apiKey: process.env.OPENAI_API_KEY || "",
        });

        try {
            const response = await generateText({
                model: openai("gpt-5-mini"),
                prompt: systemPrompt,
                tools: tools,
                stopWhen: stepCountIs(20),
            });

            openaiLogger.info("Generation finished", {
                textLength: response.text.length,
            });

            return {
                text: response.text,
            };
        } catch (error) {
            openaiLogger.error("Generation failed", error);
            throw error;
        }
    }
}

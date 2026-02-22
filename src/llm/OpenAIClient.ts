import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { LLMClient, LLMRequest, LLMResponse } from "../interfaces";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export class OpenAIClient implements LLMClient {
  async generate({ systemPrompt, tools }: LLMRequest): Promise<LLMResponse> {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const response = await generateText({
      model: openai("gpt-5-nano"),
      prompt: systemPrompt,
      tools: tools,
      stopWhen: stepCountIs(10),
    });
    return {
      text: response.text,
    };
  }
}

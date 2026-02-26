import { LLMClient, LLMRequest, LLMResponse } from "../interfaces";
import { Logger } from "../logger";

type FakeToolStep = {
    tool: string;
    args?: any;
};

export class FakeAIClient implements LLMClient {
    constructor(private readonly logger: Logger) {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const fakeLogger = this.logger.child("FakeAI");

        const { tools, systemPrompt } = request;

        fakeLogger.info("Starting fake generation");

        const script = this.getScript(systemPrompt);

        fakeLogger.info("Loaded script", { steps: script.length });

        let lastAriaTree = "";
        for (const step of script) {
            const tool = (tools as any)[step.tool];

            if (!tool?.execute) {
                fakeLogger.error(`Tool "${step.tool}" missing execute`);
                throw new Error(`Tool "${step.tool}" missing execute`);
            }

            fakeLogger.info("Executing tool", { tool: step.tool, args: step.args });

            const result = await tool.execute(step.args ?? {});

            fakeLogger.info("Tool finished", { tool: step.tool });

            if (step.tool === "ariaTree") {
                lastAriaTree = result;
            }
        }

        fakeLogger.info("Fake generation finished");

        return { text: lastAriaTree };
    }

    private getScript(systemPrompt: string): FakeToolStep[] {
        if (systemPrompt.includes("<goal>search</goal>")) {
            return [
                { tool: "ariaTree" },
                { tool: "typeTool", args: { id: 10, text: "playwright" } },
                { tool: "clickTool", args: { id: 15 } },
                { tool: "ariaTree" },
            ];
        }

        if (systemPrompt.includes("<goal>navigation</goal>")) {
            return [
                { tool: "ariaTree" },
                { tool: "clickTool", args: { id: 24 } },
                { tool: "ariaTree" },
                { tool: "ariaTree" }, // for testing ariaTree cache
                { tool: "clickTool", args: { id: 49 } },
                { tool: "ariaTree" },
                { tool: "clickTool", args: { id: 71 } },
                { tool: "ariaTree" },
            ];
        }

        throw new Error("No fake script found");
    }
}

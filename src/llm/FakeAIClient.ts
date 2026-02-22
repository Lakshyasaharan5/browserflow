import { LLMClient, LLMRequest, LLMResponse } from "../interfaces";

type FakeToolStep = {
  tool: string;
  args?: any;
};

export class FakeAIClient implements LLMClient {
  async generate(request: LLMRequest): Promise<LLMResponse> {
    const { tools, systemPrompt } = request;
    const script = this.getScript(systemPrompt);
    let lastAriaTree = "";
    for (const step of script) {
      const tool = (tools as any)[step.tool];

      if (!tool?.execute) {
        throw new Error(`Tool "${step.tool}" missing execute`);
      }

      const result = await tool.execute(step.args ?? {});

      console.log(`[FakeLLM] ${step.tool}`, result);
      if (step.tool === "ariaTree") {
        lastAriaTree = result;
      }
    }

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
        { tool: "clickTool", args: { id: 49 } },
        { tool: "ariaTree" },
        { tool: "clickTool", args: { id: 71 } },
        { tool: "ariaTree" },
      ];
    }

    throw new Error("No fake script found");
  }
}

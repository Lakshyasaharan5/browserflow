import { ToolSet, tool } from "ai";
import { AgentState } from "./interfaces";
import { distill } from "./htmlDistiller";
import { z } from "zod";

export function createTools(state: AgentState): ToolSet {
  const toolSet: ToolSet = {
    ariaTree: tool({
      description:
        "gets the accessibility (ARIA) hybrid tree text for the current page. use this to understand structure and content.",
      inputSchema: z.object({}),
      execute: async () => {
        const { llmReadyTree, xpathMap } = await distill(state.page);
        state.xpathMap = xpathMap;
        return llmReadyTree;
      },
    }),
    clickTool: tool({
      description:
        "clicks an element on the page. use this to interact with elements.",
      inputSchema: z.object({ id: z.number() }),
      execute: async ({ id }) => {
        const xpath = state.xpathMap.get(id);
        if (!xpath) {
          throw new Error(`No xpath found for id ${id}`);
        }
        await state.page.locator(xpath).click();
        await state.page.waitForLoadState("domcontentloaded");
        return `Clicked element ${id}`;
      },
    }),
    typeTool: tool({
      description:
        "types text into an element on the page. use this to interact with elements.",
      inputSchema: z.object({
        id: z.number(),
        text: z.string(),
      }),
      execute: async ({ id, text }) => {
        const xpath = state.xpathMap.get(id);
        if (!xpath) {
          throw new Error(`No xpath found for id ${id}`);
        }
        await state.page.locator(xpath).fill(text);
        await state.page.waitForLoadState("domcontentloaded");
        return `Typed "${text}" into element ${id}`;
      },
    }),
  };
  return toolSet;
}

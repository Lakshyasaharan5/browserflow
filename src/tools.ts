import { ToolSet, tool } from "ai";
import { AgentState } from "./interfaces";
import { distill } from "./htmlDistiller";
import { z } from "zod";

export function createTools(state: AgentState): ToolSet {
    const toolsLogger = state.logger.child("Tools");

    const toolSet: ToolSet = {
        ariaTree: tool({
            description:
                "gets the accessibility (ARIA) hybrid tree text for the current page. use this to understand structure and content.",
            inputSchema: z.object({}),
            execute: async () => {
                const ariaTreeLogger = toolsLogger.child("AriaTree");

                if (!state.needsDistillation && state.latestAriaTree) {
                    ariaTreeLogger.info("Using latest tree", { nodes: state.xpathMap.size });
                    return state.latestAriaTree;
                }

                ariaTreeLogger.info("Distilling page");
                const { llmReadyTree, xpathMap } = await distill(state);

                state.xpathMap = xpathMap;
                state.latestAriaTree = llmReadyTree;
                state.needsDistillation = false;

                ariaTreeLogger.info("Tree generated", { nodes: xpathMap.size });
                return llmReadyTree;
            },
        }),
        clickTool: tool({
            description: "clicks an element on the page. use this to interact with elements.",
            inputSchema: z.object({ id: z.number() }),
            execute: async ({ id }) => {
                const clickLogger = toolsLogger.child("Click");

                clickLogger.info("Click requested", { id });
                const xpath = state.xpathMap.get(id);
                if (!xpath) {
                    clickLogger.error("No xpath found for id", { id });
                    throw new Error(`No xpath found for id ${id}`);
                }
                await state.page.locator(xpath).click();
                clickLogger.info("Click completed for xpath", { xpath });

                await state.page.waitForLoadState("domcontentloaded");
                state.needsDistillation = true;

                state.cache.record({ type: "click", xpath });

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
                const typeLogger = toolsLogger.child("Type");

                typeLogger.info("Type requested", { id, text });
                const xpath = state.xpathMap.get(id);
                if (!xpath) {
                    typeLogger.error("No xpath found for id", { id });
                    throw new Error(`No xpath found for id ${id}`);
                }
                await state.page.locator(xpath).fill(text);
                typeLogger.info("Type completed for xpath", { xpath });

                await state.page.waitForLoadState("domcontentloaded");
                state.needsDistillation = true;

                state.cache.record({ type: "type", xpath, text });

                return `Typed "${text}" into element ${id}`;
            },
        }),
    };
    return toolSet;
}

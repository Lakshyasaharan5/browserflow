# BrowserFlow

A lightweight AI browser automation agent built with Playwright + LLM tools.  
Instead of sending raw HTML to an LLM, BrowserFlow builds a compact accessibility-based representation of the page and lets the model operate through structured tools.

```typescript
import { BrowserFlow } from "browserflow";

const flow = new BrowserFlow();

await flow.execute({
  userQuery: "Can you please search for one-way flights from New York to Seattle for 1 March, 2026 and tell me price of first 5 flights?",
  url: "https://google.com/travel/flights",
});
```

Demo video.....

## Performance

### Replay Caching

BrowserFlow records agent actions as deterministic tool steps. When the same task is executed again, the framework can replay these recorded steps instead of calling the LLM. This removes unnecessary model calls, speeds up execution, and makes repeated workflows significantly cheaper while keeping results consistent. 

Please note that cache healing is not yet implemented, which means page structure might have changed and the model will try to work assuming the same html.

### HTML Distiller

Raw HTML is noisy and expensive to send to a language model, so BrowserFlow builds a distilled representation of the page using the browser’s Accessibility Tree (AX Tree). During this process, structural noise is removed, redundant nodes are collapsed, and decorative elements are discarded. The final output is a compact, LLM-friendly tree that preserves meaning while dramatically reducing complexity.

#### Before (raw accessibility tree)

```typescript
RootWebArea "Homepage - Ultimate QA" (backendId: 3)
  none (backendId: 62)
    none (backendId: 152)
      generic (backendId: 153)
        generic (backendId: 154)
          banner (backendId: 155)
            generic (backendId: 157)
              generic (backendId: 158)
                generic (backendId: 7)
                  generic (backendId: 8)
                    generic (backendId: 9)
                      generic (backendId: 10)
                        none (backendId: 161)
                          generic (backendId: 11)
	                          link (backendId: 162)                              
	                              link "Services" (backendId: 14)
	                                StaticText "Services" (backendId: 167)
	                                  InlineTextBox "Services" (backendId: -)
```	                                  
	
#### After (distilled tree)

```typescript
RootWebArea "Homepage - Ultimate QA"
  banner
    link
    navigation
      list
        listitem
          link "Services"
```

The result is a much smaller context window, cleaner reasoning signals for the model, and massive amount of token reduction.

### Token reduction metrics

Each distillation run logs measurable metrics comparing the raw and distilled trees. BrowserFlow tracks node counts, token counts, and reduction percentages using `tiktoken`, making optimization visible and measurable instead of relying on intuition.

## Architecture

diagram....

### Inspiration

I was inspired by the ideas behind [browserbase/stagehand](https://github.com/browserbase/stagehand), an open-source browser automation agent with strong orchestration concepts. While learning about agentic systems, I found the approach compelling and decided to build my own minimal version focused on deterministic tooling, accessibility-tree reasoning, and token efficiency.


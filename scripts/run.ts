import { BrowserAgent } from "../src";

async function main() {
  const agent = new BrowserAgent();

  const result = await agent.execute({
    userQuery: "Can you tell me pricing details and team information?",
    url: "file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html",    
  });

  console.log("Result:", result);
}

main().catch(console.error);
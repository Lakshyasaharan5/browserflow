import { BrowserFlow } from "../src";

async function main() {
  const agent = new BrowserFlow();

  // const result = await agent.execute({
  //   userQuery: "Can you search for 'playwright' and tell me what you find?",
  //   url: "file:///Users/lakshyasaharan/projects/stagehand-lite/examples/search-result/index.html",    
  // });

  // const result = await agent.execute({
  //   userQuery: "Can you please summarize the first case study? Its usually in About section.",
  //   url: "https://ultimateqa.com/",    
  // });

  const result = await agent.execute({
    userQuery: "Can you please search for flights from New York to Seattle for 1 March, 2026 for 1 Adult one way and tell me price of first 5 flights?",
    url: "https://www.google.com/travel/flights?tfs=CBwQARoPag0IAhIJL20vMDJfMjg2QAFIAXABggELCP___________wGYAQI&tfu=KgIIAw&hl=en-US&gl=US",    
  });

  console.log("Result:", result);  
}

main().catch(console.error);
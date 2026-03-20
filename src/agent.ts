import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { ui } from "./ui.js";
import type { ResearchConfig, ResearchSession } from "./types.js";

const MODEL = "claude-opus-4-6";

// Effort level by research depth
const EFFORT_MAP = {
  quick: "medium",
  standard: "high",
  deep: "max",
} as const;

// Max search/fetch uses per depth
const MAX_USES_MAP = {
  quick: 3,
  standard: 8,
  deep: 20,
} as const;

function buildSystemPrompt(config: ResearchConfig): string {
  return `You are an expert research analyst. Your task is to thoroughly research the topic: "${config.topic}"

Approach:
1. Start with targeted web searches to understand the landscape
2. Fetch key pages to extract detailed information
3. Cross-reference sources to verify facts
4. Synthesize findings into a comprehensive, well-structured report

Research depth: ${config.depth}
${config.depth === "deep" ? "Be exhaustive — explore multiple angles, recent developments, controversies, and expert opinions." : ""}
${config.depth === "quick" ? "Focus on the most important high-level points." : ""}

Output format: Produce a polished Markdown report with:
- An executive summary
- Well-organized sections with headers
- Key findings and insights
- Sources cited inline [1], [2] etc.
- A references section at the end

Be factual, balanced, and cite your sources.`;
}

export async function runResearchAgent(config: ResearchConfig): Promise<void> {
  const client = new Anthropic();

  const session: ResearchSession = {
    topic: config.topic,
    startTime: new Date(),
    searchesPerformed: 0,
    pagesVisited: 0,
    thinkingTokens: 0,
  };

  ui.banner();
  ui.status(`Researching: "${config.topic}" (depth: ${config.depth})`);

  const tools: Anthropic.Messages.ToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: MAX_USES_MAP[config.depth],
    },
    {
      type: "web_fetch_20260209",
      name: "web_fetch",
      max_uses: MAX_USES_MAP[config.depth],
    },
  ];

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Research the following topic and produce a comprehensive report:\n\n**${config.topic}**\n\nUse web search and web fetch to gather up-to-date information. Think carefully before concluding.`,
    },
  ];

  let reportText = "";
  let iterationCount = 0;
  const MAX_ITERATIONS = config.depth === "deep" ? 10 : 5;

  // Agentic loop — handles pause_turn for server-side tool continuation
  while (iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    ui.section(`Iteration ${iterationCount}`);

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT_MAP[config.depth] },
      system: buildSystemPrompt(config),
      tools,
      messages,
    });

    let currentBlockType: string | null = null;
    let currentToolName: string | null = null;
    let currentToolInput = "";
    let accumulatedText = "";

    // Stream events
    for await (const event of stream) {
      switch (event.type) {
        case "content_block_start":
          currentBlockType = event.content_block.type;
          currentToolInput = "";

          if (event.content_block.type === "thinking") {
            ui.section("Thinking");
          } else if (event.content_block.type === "text") {
            ui.section("Response");
          } else if (event.content_block.type === "tool_use") {
            currentToolName = event.content_block.name;
          } else if (event.content_block.type === "server_tool_use") {
            currentToolName = event.content_block.name;
          }
          break;

        case "content_block_delta":
          if (event.delta.type === "thinking_delta") {
            ui.thinking(event.delta.thinking);
          } else if (event.delta.type === "text_delta") {
            ui.response(event.delta.text);
            accumulatedText += event.delta.text;
          } else if (event.delta.type === "input_json_delta") {
            currentToolInput += event.delta.partial_json;
          }
          break;

        case "content_block_stop":
          if (
            (currentBlockType === "tool_use" ||
              currentBlockType === "server_tool_use") &&
            currentToolName
          ) {
            // Parse tool input for display
            let inputSnippet = currentToolInput;
            try {
              const parsed = JSON.parse(currentToolInput);
              inputSnippet =
                parsed.query || parsed.url || JSON.stringify(parsed);
            } catch {
              // leave as-is
            }

            if (
              currentToolName === "web_search" ||
              currentToolName === "web_search_20260209"
            ) {
              session.searchesPerformed++;
              ui.toolCall("web_search", inputSnippet);
            } else if (
              currentToolName === "web_fetch" ||
              currentToolName === "web_fetch_20260209"
            ) {
              session.pagesVisited++;
              ui.toolCall("web_fetch", inputSnippet);
            }
          }

          if (currentBlockType === "thinking") {
            console.log(); // newline after thinking block
          }

          currentBlockType = null;
          currentToolName = null;
          currentToolInput = "";
          break;

        case "message_delta":
          // Track web search/fetch tool results in the event stream
          if (event.type === "message_delta") {
            // handled below via finalMessage
          }
          break;
      }
    }

    const message = await stream.finalMessage();

    // Track thinking tokens from usage
    if (message.usage) {
      // thinking tokens aren't directly in usage, but we track output tokens as proxy
      session.thinkingTokens += message.usage.output_tokens ?? 0;
    }

    // Count tool results from response content for display feedback
    for (const block of message.content) {
      if (
        block.type === "web_search_tool_result" ||
        block.type === "server_tool_use"
      ) {
        if (block.type === "web_search_tool_result") {
          ui.toolResult("web_search", JSON.stringify(block.content).slice(0, 80));
        }
      }
    }

    if (accumulatedText) {
      reportText = accumulatedText;
    }

    // Check stop reason
    if (message.stop_reason === "end_turn") {
      break;
    }

    if (message.stop_reason === "pause_turn") {
      // Server-side tools hit iteration limit — continue
      messages.push({ role: "assistant", content: message.content });
      ui.status("Continuing research (server-side tools resuming)…");
      continue;
    }

    if (message.stop_reason === "max_tokens") {
      ui.status("Max tokens reached — finalizing report.");
      break;
    }

    // Append assistant message and loop
    messages.push({ role: "assistant", content: message.content });

    // If no tool calls, we're done
    const hasToolUse = message.content.some(
      (b) => b.type === "tool_use" || b.type === "server_tool_use"
    );
    if (!hasToolUse) {
      break;
    }
  }

  console.log("\n");
  ui.stats(session);

  // Save report
  if (reportText) {
    const outputFile =
      config.outputFile ??
      `report-${config.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now()}.md`;

    const outputPath = path.resolve(outputFile);
    const header = `# Research Report: ${config.topic}\n\n_Generated: ${new Date().toISOString()}_\n_Model: ${MODEL} | Depth: ${config.depth}_\n\n---\n\n`;
    await fs.writeFile(outputPath, header + reportText, "utf-8");
    ui.saved(outputPath);
  }
}

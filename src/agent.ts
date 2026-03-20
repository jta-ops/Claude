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
  return `You are an expert research analyst with coding skills. Your task is to thoroughly research the topic: "${config.topic}"

Approach:
1. Start with targeted web searches to understand the landscape
2. Fetch key pages to extract detailed information
3. Cross-reference sources to verify facts
4. Use code execution to: perform calculations, analyze data, generate statistics, create visualizations (charts/graphs saved as PNG), or process structured data you've gathered
5. Synthesize findings into a comprehensive, well-structured report

When to use code:
- Computing statistics, trends, or comparisons from data you've found
- Creating charts or visualizations to illustrate key points (use matplotlib, save as PNG)
- Parsing structured data (JSON, CSV, tables) from fetched pages
- Any numerical analysis that strengthens your findings

Research depth: ${config.depth}
${config.depth === "deep" ? "Be exhaustive — explore multiple angles, recent developments, controversies, expert opinions, and use code to analyze any quantitative data you find." : ""}
${config.depth === "quick" ? "Focus on the most important high-level points." : ""}

Output format: Produce a polished Markdown report with:
- An executive summary
- Well-organized sections with headers
- Key findings and insights, including any charts you generated (reference them by filename)
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
    codeExecutions: 0,
    savedFiles: [],
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
    {
      type: "code_execution_20260120",
      name: "code_execution",
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

        case "content_block_stop": {
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
                parsed.query || parsed.url || parsed.command || parsed.code
                  ? (parsed.command ?? parsed.code ?? parsed.query ?? parsed.url)
                  : JSON.stringify(parsed);
            } catch {
              // leave as-is
            }

            if (currentToolName === "web_search") {
              session.searchesPerformed++;
              ui.toolCall("web_search", inputSnippet);
            } else if (currentToolName === "web_fetch") {
              session.pagesVisited++;
              ui.toolCall("web_fetch", inputSnippet);
            } else if (currentToolName === "bash" || currentToolName === "code_execution") {
              session.codeExecutions++;
              ui.codeRun(inputSnippet);
            }
          }

          if (currentBlockType === "thinking") {
            console.log(); // newline after thinking block
          }

          currentBlockType = null;
          currentToolName = null;
          currentToolInput = "";
          break;
        }
      }
    }

    const message = await stream.finalMessage();

    // Track thinking tokens from usage
    if (message.usage) {
      session.thinkingTokens += message.usage.output_tokens ?? 0;
    }

    // Handle code execution results: show output and download generated files
    for (const block of message.content) {
      if (block.type === "bash_code_execution_tool_result") {
        const result = block.content;
        if (result.type === "bash_code_execution_result") {
          ui.codeOutput(result.stdout ?? "", result.stderr ?? "", result.return_code ?? 0);

          // Download any files produced by the code (e.g. charts)
          if (result.content) {
            for (const fileRef of result.content) {
              if (fileRef.type === "bash_code_execution_output") {
                try {
                  const meta = await client.beta.files.retrieveMetadata(fileRef.file_id);
                  const download = await client.beta.files.download(fileRef.file_id);
                  const safeName = path.basename(meta.filename ?? fileRef.file_id);
                  const reportDir = config.outputFile
                    ? path.dirname(path.resolve(config.outputFile))
                    : process.cwd();
                  const dest = path.join(reportDir, safeName);
                  const buf = Buffer.from(await download.arrayBuffer());
                  await fs.writeFile(dest, buf);
                  session.savedFiles.push(safeName);
                  ui.fileSaved(safeName, dest);
                } catch {
                  // file download optional — don't fail the whole run
                }
              }
            }
          }
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

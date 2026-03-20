#!/usr/bin/env node
import { runResearchAgent } from "./agent.js";
import { ui } from "./ui.js";
import type { ResearchConfig } from "./types.js";
import * as readline from "readline/promises";

function parseArgs(): Partial<ResearchConfig> {
  const args = process.argv.slice(2);
  const config: Partial<ResearchConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" || arg === "-t") {
      config.topic = args[++i];
    } else if (arg === "--depth" || arg === "-d") {
      const d = args[++i] as ResearchConfig["depth"];
      if (["quick", "standard", "deep"].includes(d)) config.depth = d;
    } else if (arg === "--output" || arg === "-o") {
      config.outputFile = args[++i];
    } else if (!arg.startsWith("-")) {
      // bare positional argument = topic
      config.topic = arg;
    }
  }

  return config;
}

async function promptForConfig(): Promise<ResearchConfig> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const topic = await rl.question("  Research topic: ");

  const depthInput = await rl.question(
    "  Depth [quick / standard / deep] (default: standard): "
  );

  rl.close();

  const depth =
    ["quick", "standard", "deep"].includes(depthInput.trim())
      ? (depthInput.trim() as ResearchConfig["depth"])
      : "standard";

  return { topic: topic.trim(), depth };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    ui.error(
      "ANTHROPIC_API_KEY environment variable is not set.\nSet it in a .env file or export it before running."
    );
    process.exit(1);
  }

  const partial = parseArgs();

  let config: ResearchConfig;

  if (partial.topic) {
    config = {
      topic: partial.topic,
      depth: partial.depth ?? "standard",
      outputFile: partial.outputFile,
    };
  } else {
    // Interactive mode
    console.log("\n  Welcome to the Claude Research Agent!");
    console.log("  ─────────────────────────────────────\n");
    config = await promptForConfig();
    if (partial.outputFile) config.outputFile = partial.outputFile;
  }

  if (!config.topic) {
    ui.error("No topic provided.");
    process.exit(1);
  }

  try {
    await runResearchAgent(config);
  } catch (err) {
    if (err instanceof Error) {
      ui.error(err.message);
    } else {
      ui.error(String(err));
    }
    process.exit(1);
  }
}

main();

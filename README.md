# Claude Research Agent

An autonomous research agent powered by **Claude Opus 4.6** with adaptive thinking, web search, and streaming.

Give it a topic — it searches the web, digs into sources, thinks deeply, and produces a polished Markdown report.

## Features

- **Autonomous web research** — uses `web_search` + `web_fetch` server-side tools
- **Adaptive thinking** — Claude reasons through the research with extended thinking
- **Streaming output** — watch thinking and responses appear in real time
- **3 depth levels** — quick (fast overview), standard, deep (exhaustive)
- **Markdown reports** — auto-saved to disk with sources cited

## Setup

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

## Usage

### Interactive
```bash
npm run dev
```

### CLI
```bash
# Quick research
npm run dev -- --topic "quantum computing" --depth quick

# Deep dive
npm run dev -- --topic "CRISPR gene editing 2025" --depth deep

# Custom output file
npm run dev -- -t "AI safety" -d standard -o ai-safety-report.md

# Positional topic shorthand
npm run dev -- "the future of fusion energy"
```

### Depth Levels

| Depth    | Searches | Use case |
|----------|----------|----------|
| quick    | up to 3  | Fast overview, bullet points |
| standard | up to 8  | Balanced depth (default) |
| deep     | up to 20 | Exhaustive research |

## Architecture

```
src/
├── index.ts   — CLI entry point + argument parsing
├── agent.ts   — Core agentic loop (streaming + tool handling)
├── ui.ts      — Terminal UI helpers
└── types.ts   — Shared types
```

The agent uses an **agentic loop** with `client.messages.stream()`:
1. Sends the research prompt with web search/fetch tools enabled
2. Streams thinking blocks and text in real time
3. Handles `pause_turn` for server-side tool continuation
4. Loops until `end_turn` or no more tool calls
5. Saves the final report to Markdown

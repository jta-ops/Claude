import chalk from "chalk";

export const ui = {
  banner() {
    console.log(
      chalk.cyan(`
╔══════════════════════════════════════════╗
║      🔍  Claude Research Agent  🔍       ║
║   Powered by claude-opus-4-6 + Web       ║
╚══════════════════════════════════════════╝
`)
    );
  },

  section(label: string) {
    console.log(chalk.bold.blue(`\n── ${label} ──`));
  },

  thinking(text: string) {
    process.stdout.write(chalk.dim.italic(text));
  },

  response(text: string) {
    process.stdout.write(chalk.white(text));
  },

  toolCall(name: string, detail: string) {
    console.log(chalk.yellow(`\n⚡ [${name}] `) + chalk.dim(detail));
  },

  toolResult(name: string, snippet: string) {
    const truncated =
      snippet.length > 120 ? snippet.slice(0, 120) + "…" : snippet;
    console.log(chalk.green(`   ✓ [${name}] `) + chalk.dim(truncated));
  },

  status(msg: string) {
    console.log(chalk.cyan(`\n   ${msg}`));
  },

  stats(session: {
    topic: string;
    startTime: Date;
    searchesPerformed: number;
    pagesVisited: number;
    thinkingTokens: number;
  }) {
    const elapsed = ((Date.now() - session.startTime.getTime()) / 1000).toFixed(
      1
    );
    console.log(
      chalk.bold.green(`
╔══════════════════════════════════════════╗
║               Research Complete          ║
╚══════════════════════════════════════════╝`) +
        chalk.white(`
  Topic:     ${session.topic}
  Duration:  ${elapsed}s
  Searches:  ${session.searchesPerformed}
  Pages:     ${session.pagesVisited}
  Thinking:  ${session.thinkingTokens.toLocaleString()} tokens
`)
    );
  },

  error(msg: string) {
    console.error(chalk.red(`\n✗ Error: ${msg}`));
  },

  saved(path: string) {
    console.log(chalk.bold.green(`\n📄 Report saved → `) + chalk.underline(path));
  },
};

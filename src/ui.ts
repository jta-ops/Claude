import chalk from "chalk";

export const ui = {
  banner() {
    console.log(
      chalk.cyan(`
╔══════════════════════════════════════════╗
║      🔍  Claude Research Agent  🔍       ║
║  Powered by claude-opus-4-6 + Web + Code ║
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

  codeRun(snippet: string) {
    const truncated =
      snippet.length > 100 ? snippet.slice(0, 100) + "…" : snippet;
    console.log(chalk.magenta(`\n💻 [code_execution] `) + chalk.dim(truncated));
  },

  codeOutput(stdout: string, stderr: string, exitCode: number) {
    if (stdout) {
      const lines = stdout.trim().split("\n").slice(0, 6);
      lines.forEach((l) =>
        console.log(chalk.green("   │ ") + chalk.dim(l))
      );
      if (stdout.trim().split("\n").length > 6)
        console.log(chalk.dim("   │ …"));
    }
    if (stderr) {
      const lines = stderr.trim().split("\n").slice(0, 3);
      lines.forEach((l) =>
        console.log(chalk.red("   │ ") + chalk.dim(l))
      );
    }
    const icon = exitCode === 0 ? chalk.green("   ✓") : chalk.red("   ✗");
    console.log(`${icon} ${chalk.dim(`exit ${exitCode}`)}`);
  },

  fileSaved(name: string, dest: string) {
    console.log(
      chalk.magenta(`   💾 Saved generated file: `) +
        chalk.underline(dest) +
        chalk.dim(` (${name})`)
    );
  },

  status(msg: string) {
    console.log(chalk.cyan(`\n   ${msg}`));
  },

  stats(session: {
    topic: string;
    startTime: Date;
    searchesPerformed: number;
    pagesVisited: number;
    codeExecutions: number;
    savedFiles: string[];
    thinkingTokens: number;
  }) {
    const elapsed = ((Date.now() - session.startTime.getTime()) / 1000).toFixed(
      1
    );
    const fileLines =
      session.savedFiles.length > 0
        ? `\n  Files:     ${session.savedFiles.join(", ")}`
        : "";
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
  Code runs: ${session.codeExecutions}
  Thinking:  ${session.thinkingTokens.toLocaleString()} tokens${fileLines}
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

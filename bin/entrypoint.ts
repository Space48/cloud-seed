#!/usr/bin/env node
import arg from "arg";

export type cliCommand = (argv?: string[]) => void;
const commands: { [command: string]: () => Promise<cliCommand> } = {
  build: async () => await import("../cli/build.js").then(i => i.cmdBuild),
  list: async () => await import("../cli/list.js").then(i => i.cmdList),
};

const args = arg(
  {
    // Types
    "--help": Boolean,

    // Aliases
    "-h": "--help",
  },
  {
    permissive: true,
  },
);

// Check if we are running `cloud-seed <subcommand>` or `cloud-seed`
const foundCommand = Boolean(commands[args._[0]]);

// Makes sure the `cloud-seed --help` case is covered
// This help message is only showed for `cloud-seed --help` or `cloud-seed`
// `cloud-seed <subcommand> --help` falls through to be handled later
if (!foundCommand || (!foundCommand && args["--help"])) {
  console.log(`
    Usage
      $ cloud-seed <command>
    Available commands
      ${Object.keys(commands).join(", ")}
    Options
      --help, -h      Displays this message
    For more information run a command with the --help flag
      $ cloud-seed build --help
  `);
  process.exit(0);
}

const command = args._[0];
const forwardedArgs = foundCommand ? args._.slice(1) : args._;

if (args["--help"]) {
  forwardedArgs.push("--help");
}

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

void commands[command]()
  .then(exec => exec(forwardedArgs))
  .then(async () => {
    if (command === "build") {
      process.exit(0);
    }
  });

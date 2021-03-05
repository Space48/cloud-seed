import arg from "arg";
import { existsSync } from "fs";
import { resolve } from "path";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import build from "../build";

export const cmdBuild: cliCommand = (argv) => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--debug": Boolean,
    "--project": String,
    "--region": String,

    // Aliases
    "-h": "--help",
    "-d": "--debug",
  };

  let args: arg.Result<arg.Spec>;
  try {
    args = arg(validArgs, { argv });
  } catch (error) {
    if (error.code === "ARG_UNKNOWN_OPTION") {
      return printAndExit(error.message);
    }
    throw error;
  }

  if (args["--help"]) {
    return printAndExit(
      `
    Usage
      $ s48-terraformer build <directory> [--options]
    Options
      --project=[name]  Set a project name
      --region=[region] Set a valid region (defaults to europe-west2 for GCP)
      --help, -h        Displays this message
      --debug, -d       Outputs debug logging
    For more information run a command with the --help flag
      $ s48-terraformer build --help
      `,
      0,
    );
  }

  if (!args["--project"]) {
    return printAndExit("--project must be set with the project name!", 1);
  }

  const dir = resolve(args._[0] || ".");
  if (!existsSync(dir)) {
    return printAndExit(`> No such directory exists as the project root: ${dir}`);
  }

  const region = args["--region"] ?? "europe-west2";
  return build(dir, (args["--project"] as unknown) as string, region, !!args["--debug"]);
};

import arg from "arg";
import { existsSync } from "fs";
import { resolve } from "path";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import build from "../build";

export const cmdBuild: cliCommand = argv => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--debug": Boolean,
    "--env": String,
    "--out-dir": String,

    // Aliases
    "-h": "--help",
    "-d": "--debug",
  };

  let args: arg.Result<arg.Spec>;
  try {
    args = arg(validArgs, { argv });
  } catch (error: any) {
    if (error.code === "ARG_UNKNOWN_OPTION") {
      return printAndExit(error.message);
    }
    throw error;
  }

  if (args["--help"]) {
    return printAndExit(
      `
    Usage
      $ cloud-seed build <directory> [--options]
    Options
      --env=[env]       Set an environment eg: production, staging, dev, uat
      --out-dir=[dir]   Set the dir for the build files
      --help, -h        Displays this message
      --debug, -d       Outputs debug logging
    For more information run a command with the --help flag
      $ cloud-seed build --help
      `,
      0,
    );
  }

  const dir = args._[0] || ".";
  if (!existsSync(resolve(dir))) {
    return printAndExit(`> No such directory exists as the project root: ${dir}`);
  }

  const outDir = args["--out-dir"];
  const environment = args["--env"];
  return build({
    dir,
    outDir,
    debug: !!args["--debug"],
    environment,
  });
};

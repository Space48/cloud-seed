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
    "--src-dir": String,
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
      --src-dir=[src]   Set the dir for the source files
      --out-dir=[dir]   Set the dir for the build files
      --help, -h        Displays this message
      --debug, -d       Outputs debug logging
    For more information run a command with the --help flag
      $ cloud-seed build --help
      `,
      0,
    );
  }

  const rootDir = args._[0] || ".";
  if (!existsSync(resolve(rootDir))) {
    return printAndExit(`> No such directory exists as the project root: ${rootDir}`);
  }
  const srcDir = args["--src-dir"];
  if (srcDir && !existsSync(resolve(srcDir))) {
    return printAndExit(`> No such directory exists as the project source directory: ${srcDir}`);
  }
  const outDir = args["--out-dir"];
  const environment = args["--env"];
  return build({
    rootDir,
    srcDir,
    outDir,
    debug: !!args["--debug"],
    environment,
  });
};

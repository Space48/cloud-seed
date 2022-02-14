import arg from "arg";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import list from "../list";
import { existsSync } from "fs";
import { resolve } from "path";

export const cmdList: cliCommand = argv => {
  const validArgs: arg.Spec = {
    // Types
    "--out-dir": String,
    "--help": Boolean,
    // Aliases
    "-h": "--help",
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
      $ cloud-seed list [--options]
    Prints a list of built functions
    Options
      --out-dir=[dir]   Set the dir for the build files
    For more information run a command with the --help flag
      $ cloud-seed list --help
      `,
      0,
    );
  }

  const outDir = args["--out-dir"];
  if (outDir && !existsSync(resolve(outDir))) {
    return printAndExit(`> No such directory exists as the build directory: ${outDir}`);
  }

  return list(outDir);
};

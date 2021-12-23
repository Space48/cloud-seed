import arg from "arg";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import list from "../list";

export const cmdList: cliCommand = argv => {
  const validArgs: arg.Spec = {
    // Types
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
      $ cloud-seed list
    Prints a list of built functions
    For more information run a command with the --help flag
      $ cloud-seed list --help
      `,
      0,
    );
  }

  return list();
};

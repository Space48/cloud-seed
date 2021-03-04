import arg from "arg";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import deployLocal from "../deployLocal";

export const cmdDeployLocal: cliCommand = (argv) => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--name": String,
    "--type": String,
    // Aliases
    "-h": "--help",
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
    return printAndExit("Help me", 0);
  }

  if (!args["--name"]) {
    return printAndExit("--name must be set with the name of the function!", 1);
  }

  const allowedTypes = ["http", "event"];
  if (!args["--type"] || !allowedTypes.includes((args["--type"] as unknown) as string)) {
    return printAndExit("--type must be = (http | event)", 1);
  }

  return deployLocal((args["--name"] as unknown) as string, (args["--type"] as unknown) as string);
};

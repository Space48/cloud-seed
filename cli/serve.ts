import arg from "arg";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import { existsSync } from "fs";
import { resolve } from "path";
import serve from "../serve";

const BUILD_DIR = "./.build/functions";

export const cmdServe: cliCommand = (argv) => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--port": Number,

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
    return printAndExit(
      `
    Usage
      $ s48-terraformer serve <name> [--options]
    Serves the function <name> on the local machine
    Options
      --port            Port to serve function on
      --help, -h        Displays this message
    For more information run a command with the --help flag
      $ s48-terraformer serve --help
      `,
      0,
    );
  }

  if (!args._[0]) {
    return printAndExit("> Function name must be provided");
  }

  const fnName = args._[0];
  if (!existsSync(resolve(BUILD_DIR + "/" + fnName))) {
    return printAndExit(
      `> No such function exists: ${fnName}. Are you sure you ran the build command first?`,
    );
  }

  return serve(BUILD_DIR, fnName, args["--port"]);
};

import arg, { ArgError } from "arg";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cliCommand } from "../bin/entrypoint";
import { printAndExit } from "./utils";
import run from "../run";

const argumentSchema = {
  "-h": "--help",
  "--help": Boolean,

  "--env": String,

  "-p": "--port",
  "--port": Number,
};

export const cmdRun: cliCommand = argv => {
  let args: arg.Result<typeof argumentSchema>;

  try {
    args = arg(argumentSchema, { argv });
  } catch (error) {
    if (error instanceof ArgError && error.code === "ARG_UNKNOWN_OPTION") {
      return printAndExit(error.message);
    }

    throw error;
  }

  if (args["--help"]) {
    return printAndExit(
      `
      Usage
        $ cloud-seed run <path/to/function.ts> --env=<environment>
      Options
        --env=<environment>           Use the configuration from the specified environment in cloud-seed.json
        --help, -h                    Displays this message
        --port=<number>, -p=<number>  Specify the port to run the environment on (default: 3000)`,
      0,
    );
  }

  const environment = args["--env"];
  if (!environment) {
    return printAndExit("> Environment is required. Please set the --env flag.");
  }

  const port = args["--port"] ?? 3000;

  const sourceFile = args._[0];
  if (!existsSync(resolve(sourceFile))) {
    return printAndExit(`> No such file exists: ${sourceFile}`);
  }

  return run({
    environment,
    port,
    sourceFile,
  });
};

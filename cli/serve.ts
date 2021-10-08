import arg from "arg";
import { printAndExit } from "./utils";
import type { cliCommand } from "../bin/entrypoint";
import { readFileSync } from "fs";
import serve from "../serve";

const BUILD_DIR = "./.build/functions";

export const cmdServe: cliCommand = (argv) => {
  const validArgs: arg.Spec = {
    // Types
    "--help": Boolean,
    "--env": String,
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
      $ cloud-seed serve <name> [--options]
    Serves the function <name> on the local machine
    Options
      --port=[port]     Port to serve function on
      --env=[env]       Set the environment eg: production, staging, dev, uat
      --help, -h        Displays this message
    For more information run a command with the --help flag
      $ cloud-seed serve --help
      `,
      0,
    );
  }

  if (!args._[0]) {
    return printAndExit("> Function name must be provided");
  }

  const fnName = args._[0];
  let manifest;
  try {
    manifest = readFileSync(BUILD_DIR + "/../functions.json").toLocaleString();
  } catch (e) {
    if (e.code === "ENOENT") {
      return printAndExit("> No build manifest detected. Did you run the build command first?");
    } else {
      throw e;
    }
  }
  const fnConfig = JSON.parse(manifest).find(({ name }: { name: string }) => name === fnName);
  if (!fnConfig) {
    return printAndExit(
      `> No such function exists: ${fnName}. Are you sure you ran the build command first?`,
    );
  }

  let cdktf;
  try {
    cdktf = readFileSync(BUILD_DIR + "/../cdk.tf.json").toLocaleString();
  } catch (e) {
    if (e.code === "ENOENT") {
      return printAndExit("> No CDKTF config detected. Did you run the build command first?");
    } else {
      throw e;
    }
  }
  const projectId = JSON.parse(cdktf)?.provider?.google?.find(
    ({ project }: { project: string }) => project?.length,
  ).project;

  return serve(BUILD_DIR, fnConfig, projectId, args["--env"], args["--port"]);
};
